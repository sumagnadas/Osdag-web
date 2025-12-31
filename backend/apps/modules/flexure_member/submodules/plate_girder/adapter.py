"""
Plate Girder Adapter
Implements the business logic for plate girder module
"""
from apps.core.utils import (
    validate_arr, validate_num, validate_string,
    MissingKeyError, InvalidInputTypeError,
    contains_keys, custom_list_validation, float_able, int_able, is_yes_or_no, validate_list_type
)
# Lazy import to avoid PySide6 dependency during module discovery
# PlateGirderWelded will be imported when needed in create_module()
from osdag_core.custom_logger import CustomLogger
from osdag_core.Common import (
    KEY_MODULE, KEY_MATERIAL, KEY_LENGTH, KEY_LOAD, KEY_SHEAR, KEY_MOMENT,
    KEY_OVERALL_DEPTH_PG_TYPE, KEY_OVERALL_DEPTH_PG,
    KEY_WEB_THICKNESS_PG, KEY_TOP_Bflange_PG, KEY_TOP_FLANGE_THICKNESS_PG,
    KEY_BOTTOM_Bflange_PG, KEY_BOTTOM_FLANGE_THICKNESS_PG,
    KEY_DESIGN_TYPE_FLEXURE, KEY_BENDING_MOMENT_SHAPE, KEY_TORSIONAL_RES,
    KEY_WARPING_RES, KEY_MAX_DEFL, KEY_ALLOW_CLASS, KEY_WEB_PHILOSOPHY,
    KEY_SUPPORT_WIDTH, KEY_IntermediateStiffener_spacing, KEY_IntermediateStiffener_thickness,
    KEY_LongitudnalStiffener, KEY_LongitudnalStiffener_thickness,
    KEY_IntermediateStiffener_thickness_val, KEY_LongitudnalStiffener_thickness_val
)
import sys
import os
from typing import Dict, Any, List
import traceback
import json

old_stdout = sys.stdout  # Backup log
sys.stdout = open(os.devnull, "w")  # redirect stdout
sys.stdout = old_stdout  # Reset log


def get_required_keys() -> List[str]:
    """Return all required input parameters for the plate girder module."""
    return [
        "Module",                           # KEY_MODULE
        "Material",                         # KEY_MATERIAL
        "Member.Length",                    # KEY_LENGTH
        "Loading.Condition",                # KEY_LOAD
        "Load.Shear",                       # KEY_SHEAR
        "Load.Moment",                      # KEY_MOMENT
        "Total.Design_Type",                # KEY_OVERALL_DEPTH_PG_TYPE ('Customized' or 'Optimized')
        "Web.Thickness",                    # KEY_WEB_THICKNESS_PG (list)
        "TopFlange.Thickness",               # KEY_TOP_FLANGE_THICKNESS_PG (list)
        "BottomFlange.Thickness",           # KEY_BOTTOM_FLANGE_THICKNESS_PG (list)
        "Design.Design_Type_Flexure",        # KEY_DESIGN_TYPE_FLEXURE
        "Loading.Bending_Moment_Shape",      # KEY_BENDING_MOMENT_SHAPE
        "Design.Torsional_Restraint",       # KEY_TORSIONAL_RES
        "Design.Warping_Restraint",         # KEY_WARPING_RES
        "Design.Max_Deflection",            # KEY_MAX_DEFL
        "Design.Allow_Class",               # KEY_ALLOW_CLASS
        "Design.Web_Philosophy",            # KEY_WEB_PHILOSOPHY
        "Design.Support_Width",              # KEY_SUPPORT_WIDTH
        "Design.IntermediateStiffener.Spacing",  # KEY_IntermediateStiffener_spacing
        "Design.IntermediateStiffener.Thickness", # KEY_IntermediateStiffener_thickness
        "Design.LongitudnalStiffener",      # KEY_LongitudnalStiffener
        "Design.LongitudnalStiffener.Thickness", # KEY_LongitudnalStiffener_thickness
    ]


def validate_input(input_values: Dict[str, Any]) -> None:
    """Validate type for all values in design dict. Raise error when invalid"""
    required_keys = get_required_keys()
    missing_keys = contains_keys(input_values, required_keys)
    if missing_keys is not None:
        raise MissingKeyError(missing_keys[0])

    # Validate string keys
    str_keys = [
        "Module",
        "Material",
        "Loading.Condition",
        "Total.Design_Type",
        "Design.Design_Type_Flexure",
        "Loading.Bending_Moment_Shape",
        "Design.Torsional_Restraint",
        "Design.Warping_Restraint",
        "Design.Max_Deflection",
        "Design.Allow_Class",
        "Design.Web_Philosophy",
        "Design.IntermediateStiffener.Thickness",
        "Design.LongitudnalStiffener",
        "Design.LongitudnalStiffener.Thickness",
    ]
    for key in str_keys:
        if not isinstance(input_values.get(key), str):
            raise InvalidInputTypeError(key, "str")

    # Validate numeric keys (as strings that can be converted to float)
    # Some fields can be "NA" (optional fields)
    num_keys_required = [
        "Member.Length",
        "Load.Shear",
        "Load.Moment",
        "Design.Support_Width",
    ]
    for key in num_keys_required:
        if not isinstance(input_values.get(key), str) or not float_able(input_values.get(key)):
            raise InvalidInputTypeError(key, "str where str can be converted to float")
    
    # Optional numeric keys that can be "NA"
    num_keys_optional = [
        "Design.IntermediateStiffener.Spacing",
    ]
    for key in num_keys_optional:
        value = input_values.get(key)
        if value is not None:
            if not isinstance(value, str):
                raise InvalidInputTypeError(key, "str where str can be converted to float or 'NA'")
            # Allow "NA" or numeric string
            if value.upper() != "NA" and not float_able(value):
                raise InvalidInputTypeError(key, "str where str can be converted to float or 'NA'")

    # Validate list keys (for Customized design type)
    design_type = input_values.get("Total.Design_Type")
    if design_type == "Customized":
        # For Customized, we need overall depth and flange widths
        if "Total.Depth" not in input_values:
            raise MissingKeyError("Total.Depth")
        if not isinstance(input_values.get("Total.Depth"), str) or not float_able(input_values.get("Total.Depth")):
            raise InvalidInputTypeError("Total.Depth", "str where str can be converted to float")
        
        if "Topflange.Width" not in input_values:
            raise MissingKeyError("Topflange.Width")
        if not isinstance(input_values.get("Topflange.Width"), str) or not float_able(input_values.get("Topflange.Width")):
            raise InvalidInputTypeError("Topflange.Width", "str where str can be converted to float")
        
        if "Bottomflange.Width" not in input_values:
            raise MissingKeyError("Bottomflange.Width")
        if not isinstance(input_values.get("Bottomflange.Width"), str) or not float_able(input_values.get("Bottomflange.Width")):
            raise InvalidInputTypeError("Bottomflange.Width", "str where str can be converted to float")

    # Validate list types for thickness lists
    list_keys = [
        "Web.Thickness",
        "TopFlange.Thickness",
        "BottomFlange.Thickness",
    ]
    for key in list_keys:
        value = input_values.get(key)
        if not isinstance(value, list):
            raise InvalidInputTypeError(key, "List[str]")


def create_module():
    """Create an instance of the PlateGirderWelded module design class and set it up for use"""
    # Lazy import to avoid PySide6 dependency during module discovery
    from osdag_core.design_type.plate_girder.core.plate_girder import PlateGirderWelded
    module = PlateGirderWelded()
    module.set_osdaglogger(None)
    return module


def create_from_input(input_values: Dict[str, Any]):
    """Create an instance of the PlateGirderWelded module design class from input values."""
    module = None
    try:
        module = create_module()
    except Exception as e:
        print('Error in create_module:', e)
        raise
    
    # Map input_values to exact keys expected by PlateGirderWelded.set_input_values
    design_dict = {
        KEY_MODULE: input_values.get('Module', 'Plate Girder'),
        KEY_MATERIAL: input_values.get('Material', 'E 250 (Fe 410 W)A'),
        KEY_LENGTH: input_values.get('Member.Length', '5000'),
        KEY_LOAD: input_values.get('Loading.Condition', ''),
        KEY_SHEAR: input_values.get('Load.Shear', '0'),
        KEY_MOMENT: input_values.get('Load.Moment', '0'),
        KEY_OVERALL_DEPTH_PG_TYPE: input_values.get('Total.Design_Type', 'Customized'),
        KEY_WEB_THICKNESS_PG: input_values.get('Web.Thickness', ['6']),
        KEY_TOP_FLANGE_THICKNESS_PG: input_values.get('TopFlange.Thickness', ['6']),
        KEY_BOTTOM_FLANGE_THICKNESS_PG: input_values.get('BottomFlange.Thickness', ['6']),
        KEY_DESIGN_TYPE_FLEXURE: input_values.get('Design.Design_Type_Flexure', 'Major Laterally Supported'),
        KEY_BENDING_MOMENT_SHAPE: input_values.get('Loading.Bending_Moment_Shape', ''),
        KEY_TORSIONAL_RES: input_values.get('Design.Torsional_Restraint', 'No'),
        KEY_WARPING_RES: input_values.get('Design.Warping_Restraint', 'Warping not restrained in both flanges'),
        KEY_MAX_DEFL: input_values.get('Design.Max_Deflection', 'L/250'),
        KEY_ALLOW_CLASS: input_values.get('Design.Allow_Class', 'Plastic'),
        KEY_WEB_PHILOSOPHY: input_values.get('Design.Web_Philosophy', 'Thick Web'),
        KEY_SUPPORT_WIDTH: input_values.get('Design.Support_Width', '100'),
        KEY_IntermediateStiffener_spacing: input_values.get('Design.IntermediateStiffener.Spacing', ''),
        KEY_IntermediateStiffener_thickness: input_values.get('Design.IntermediateStiffener.Thickness', 'Standard'),
        KEY_LongitudnalStiffener: input_values.get('Design.LongitudnalStiffener', 'No'),
        KEY_LongitudnalStiffener_thickness: input_values.get('Design.LongitudnalStiffener.Thickness', 'Standard'),
    }
    
    # Add design type specific keys
    design_type = design_dict[KEY_OVERALL_DEPTH_PG_TYPE]
    if design_type == 'Customized':
        design_dict[KEY_OVERALL_DEPTH_PG] = input_values.get('Total.Depth', '500')
        design_dict[KEY_TOP_Bflange_PG] = input_values.get('Topflange.Width', '200')
        design_dict[KEY_BOTTOM_Bflange_PG] = input_values.get('Bottomflange.Width', '200')
    elif design_type == 'Optimized':
        # For optimized, these are not required in set_input_values
        # but we'll set defaults to avoid errors
        design_dict[KEY_OVERALL_DEPTH_PG] = '1'
        design_dict[KEY_TOP_Bflange_PG] = '1'
        design_dict[KEY_BOTTOM_Bflange_PG] = '1'
    
    # Import VALUES_STIFFENER_THICKNESS from plate_girder module
    from osdag_core.design_type.plate_girder.core.plate_girder import VALUES_STIFFENER_THICKNESS
    
    # Set default values for thickness lists (these are set in set_input_values, but we set them here too)
    if design_dict[KEY_IntermediateStiffener_thickness] == 'Customized':
        design_dict[KEY_IntermediateStiffener_thickness_val] = PlateGirderWelded.int_thicklist if PlateGirderWelded.int_thicklist else VALUES_STIFFENER_THICKNESS
    else:
        design_dict[KEY_IntermediateStiffener_thickness_val] = VALUES_STIFFENER_THICKNESS
    
    if design_dict[KEY_LongitudnalStiffener_thickness] == 'Customized':
        design_dict[KEY_LongitudnalStiffener_thickness_val] = PlateGirderWelded.long_thicklist if PlateGirderWelded.long_thicklist else VALUES_STIFFENER_THICKNESS
    else:
        design_dict[KEY_LongitudnalStiffener_thickness_val] = VALUES_STIFFENER_THICKNESS
    
    try:
        if module is None:
            raise RuntimeError('Module instance was not created')
        module.set_input_values(design_dict)
    except Exception as e:
        traceback.print_exc()
        print('Error in set_input_values:', e)
        raise

    return module


def generate_output(input_values: Dict[str, Any]):
    """
    Generate, format and return the output values from the given input values.
    """
    output = {}
    module = create_from_input(input_values)
    logs = []
    
    try:
        # Generate output values
        raw_output_text = module.output_values(True)
        
        # Get logs from the custom logger
        if hasattr(module, 'logger') and isinstance(module.logger, CustomLogger):
            logs = module.logger.get_logs()
        
        raw_output = raw_output_text

        # Process each parameter
        for i, param in enumerate(raw_output):
            if len(param) >= 4:
                key = param[0]
                label = param[1]
                param_type = param[2]
                value = param[3]
                
                # Check if it's a TextBox type and has a valid key
                if param_type == "TextBox" and key is not None:
                    # Handle numpy types
                    if hasattr(value, 'item'):
                        value = value.item()
                    
                    output[key] = {
                        "key": key,
                        "label": label,
                        "val": value
                    }
    except Exception as e:
        print(f'Error in generate_output: {e}')
        traceback.print_exc()
        
    return output, logs


def create_cad_model(input_values: Dict[str, Any], section: str, session: str) -> str:
    """Generate the CAD model from input values as a BREP file. Return file path."""
    # For now, returning empty string as CAD generation might need specific implementation
    # TODO: Implement CAD model generation if needed
    return ""

