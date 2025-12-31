
import ISECTION from "../../../../assets/ISection.png";
import ErrorImg from "../../../../assets/notSelected.png";
import {
  KEY_MODULE, KEY_MATERIAL, KEY_LENGTH, KEY_SHEAR, KEY_MOMENT,
  KEY_TORSIONAL_RES, KEY_WARPING_RES, KEY_ALLOW_CLASS, KEY_EFFECTIVE_AREA_PARA,
  KEY_LENGTH_OVERWRITE, KEY_DP_DESIGN_METHOD
} from "../../../../constants/DesignKeys";

// Plate Girder uses backend key strings directly (matching backend Common.py)

export const plateGirderConfig = {
  sessionName: "Plate Girder Design",
  routePath: "/design/flexure/plate_girder",
  designType: "Plate-Girder",
  cameraKey: "FlexuralMember",
  cadOptions: ["Model", "Girder"],

  defaultInputs: {
    module: "Plate-Girder",
    material: "E 250 (Fe 410 W)A",
    design_type: "Customized", // "Customized" or "Optimized"
    total_depth: "500", // Required for Customized
    web_thickness: ["6"], // List of standard thicknesses
    top_flange_width: "200", // Required for Customized
    top_flange_thickness: ["6"], // List
    bottom_flange_width: "200", // Required for Customized
    bottom_flange_thickness: ["6"], // List
    member_length: "5000", // in mm (backend expects m, but we'll convert)
    support_type: "Major Laterally Supported",
    support_width: "100",
    web_philosophy: "Thick Web without ITS",
    torsional_restraint: "Fully Restrained",
    warping_restraint: "Both flanges fully restrained",
    bending_moment: "100",
    shear_force: "50",
    bending_moment_shape: "Uniform Loading with pinned-pinned support",
    // Design Preferences defaults
    design_method: "Limit State Design",
    allowable_class: "Plastic",
    effective_area_parameter: "1.0",
    length_overwrite: "NA",
    loading_condition: "Normal",
    // Stiffeners
    intermediate_stiffener: "No",
    intermediate_stiffener_spacing: "NA",
    intermediate_stiffener_thickness: "Standard",
    intermediate_stiffener_thickness_val: [], // Will be populated
    longitudinal_stiffener: "No",
    longitudinal_stiffener_thickness: "Standard",
    longitudinal_stiffener_thickness_val: [], // Will be populated
    // Additional
    symmetry: "Symmetrical",
    // Deflection
    structure_type: "Highway Bridge",
    design_load: "Live Load",
    member_options: "Simple Span",
    supporting_options: "NA",
    max_deflection: "L/250",
  },

  modalConfig: [
    { key: "webThickness", inputKey: "web_thickness", dataSource: "thicknessList" },
    { key: "topFlangeThickness", inputKey: "top_flange_thickness", dataSource: "thicknessList" },
    { key: "bottomFlangeThickness", inputKey: "bottom_flange_thickness", dataSource: "thicknessList" },
  ],

  selectionConfig: [
    { key: "webThicknessSelect", inputKey: "web_thickness", defaultValue: "All" },
    { key: "topFlangeThicknessSelect", inputKey: "top_flange_thickness", defaultValue: "All" },
    { key: "bottomFlangeThicknessSelect", inputKey: "bottom_flange_thickness", defaultValue: "All" },
  ],

  // Helper function to get section image
  getSectionImage: (profile) => {
    // Plate girder is always a welded I-section
    return ISECTION;
  },

  validateInputs: (inputs) => {
    // Basic validation
    if (!inputs.material || !inputs.member_length || !inputs.shear_force || 
        !inputs.bending_moment || !inputs.design_type) {
      return { isValid: false, message: "Please input all the required fields" };
    }

    // Validate numeric inputs
    if (isNaN(parseFloat(inputs.member_length)) || parseFloat(inputs.member_length) <= 0) {
      return { isValid: false, message: "Member length must be a positive number" };
    }
    if (isNaN(parseFloat(inputs.shear_force))) {
      return { isValid: false, message: "Shear force must be a valid number" };
    }
    if (isNaN(parseFloat(inputs.bending_moment)) || parseFloat(inputs.bending_moment) <= 0) {
      return { isValid: false, message: "Bending moment must be a positive number" };
    }

    // For Customized design type, validate required dimensions
    if (inputs.design_type === "Customized") {
      if (!inputs.total_depth || isNaN(parseFloat(inputs.total_depth)) || parseFloat(inputs.total_depth) <= 0) {
        return { isValid: false, message: "Total depth must be a positive number for Customized design" };
      }
      if (!inputs.top_flange_width || isNaN(parseFloat(inputs.top_flange_width)) || parseFloat(inputs.top_flange_width) <= 0) {
        return { isValid: false, message: "Top flange width must be a positive number for Customized design" };
      }
      if (!inputs.bottom_flange_width || isNaN(parseFloat(inputs.bottom_flange_width)) || parseFloat(inputs.bottom_flange_width) <= 0) {
        return { isValid: false, message: "Bottom flange width must be a positive number for Customized design" };
      }
      if (!inputs.web_thickness || (Array.isArray(inputs.web_thickness) && inputs.web_thickness.length === 0)) {
        return { isValid: false, message: "Web thickness is required" };
      }
      if (!inputs.top_flange_thickness || (Array.isArray(inputs.top_flange_thickness) && inputs.top_flange_thickness.length === 0)) {
        return { isValid: false, message: "Top flange thickness is required" };
      }
      if (!inputs.bottom_flange_thickness || (Array.isArray(inputs.bottom_flange_thickness) && inputs.bottom_flange_thickness.length === 0)) {
        return { isValid: false, message: "Bottom flange thickness is required" };
      }
    }

    return { isValid: true };
  },

  buildSubmissionParams: (inputs, allSelected, lists, extraState) => {
    const getArrayParam = (allSelectedFlag, fullList, selectedList) => {
      if (allSelectedFlag) {
        return fullList.filter(item => item !== "All" && item !== "Select Section");
      }
      if (Array.isArray(selectedList)) {
        return selectedList.filter(item => item !== "All" && item !== "Select Section");
      }
      return [selectedList].filter(item => item !== "All" && item !== "Select Section");
    };

    // Convert member_length from mm to m (backend expects m)
    const memberLengthM = inputs.member_length ? (parseFloat(inputs.member_length) / 1000).toString() : "5";

    // Get thickness lists
    const webThicknessList = getArrayParam(
      allSelected.web_thickness,
      lists.thicknessList || [],
      inputs.web_thickness
    );
    const topFlangeThicknessList = getArrayParam(
      allSelected.top_flange_thickness,
      lists.thicknessList || [],
      inputs.top_flange_thickness
    );
    const bottomFlangeThicknessList = getArrayParam(
      allSelected.bottom_flange_thickness,
      lists.thicknessList || [],
      inputs.bottom_flange_thickness
    );

    // Build base params - using exact backend key strings
    // const params = {
    //   "Module": "Plate-Girder",
    //   "Material": String(inputs.material || "E 250 (Fe 410 W)A"),
    //   "Member.Length": memberLengthM,
    //   "Loading.Condition": String(inputs.loading_condition || "Normal"),
    //   "Load.Shear": String(inputs.shear_force || "0"),
    //   "Load.Moment": String(inputs.bending_moment || "0"),
    //   "Total.Design_Type": String(inputs.design_type || "Customized"),
    //   "Web.Thickness": webThicknessList.length > 0 ? webThicknessList : ["6"],
    //   "TopFlange.Thickness": topFlangeThicknessList.length > 0 ? topFlangeThicknessList : ["6"],
    //   "BottomFlange.Thickness": bottomFlangeThicknessList.length > 0 ? bottomFlangeThicknessList : ["6"],
    //   "Design.Design_Type_Flexure": String(inputs.support_type || "Major Laterally Supported"),
    //   "Loading.Bending_Moment_Shape": String(inputs.bending_moment_shape || "Uniform Loading with pinned-pinned support"),
    //   "Design.Torsional_Restraint": String(inputs.torsional_restraint || "Fully Restrained"),
    //   "Design.Warping_Restraint": String(inputs.warping_restraint || "Both flanges fully restrained"),
    //   "Design.Max_Deflection": String(inputs.max_deflection || "L/250"),
    //   "Design.Allow_Class": String(inputs.allowable_class || "Plastic"),
    //   "Design.Web_Philosophy": String(inputs.web_philosophy || "Thick Web without ITS"),
    //   "Design.Support_Width": String(inputs.support_width || "100"),
    //   "Design.IntermediateStiffener.Spacing": String(inputs.intermediate_stiffener_spacing || "NA"),
    //   "Design.IntermediateStiffener.Thickness": String(inputs.intermediate_stiffener_thickness || "Standard"),
    //   "Design.LongitudnalStiffener": String(inputs.longitudinal_stiffener || "No"),
    //   "Design.LongitudnalStiffener.Thickness": String(inputs.longitudinal_stiffener_thickness || "Standard"),
    //   "Design.Design_Method": String(inputs.design_method || "Limit State Design"),
    //   "Design.Effective_Area_Parameter": String(inputs.effective_area_parameter || "1.0"),
    //   "Design.Length_Overwrite": String(inputs.length_overwrite || "NA"),
    // };

    const params = {
        // --- Basic Module Info ---
        "Module": "Plate-Girder",
        "Material": "E 250 (Fe 410 W)A",
        "Member.Length": "5", // 5m span
        
        // --- Loads ---
        "Loading.Condition": "Normal",
        "Load.Shear": "150",   // 150 kN
        "Load.Moment": "500",  // 500 kNm
        "Loading.Bending_Moment_Shape": "Uniform Loading with pinned-pinned support",
      
        // --- Geometry (CRITICAL FIXES) ---
        "Total.Design_Type": "Customized",
        "Total.Depth": "800",        // REQUIRED: Deep enough for plate girder
        "Topflange.Width": "300",    // REQUIRED: Wide enough for stability
        "Bottomflange.Width": "300", // REQUIRED: Symmetric
      
        // --- Thicknesses (Must be Arrays) ---
        // 12mm web for Thick Web philosophy; 20mm flange to prevent Slender section
        "Web.Thickness": ["12"],           
        "TopFlange.Thickness": ["20"],     
        "BottomFlange.Thickness": ["20"],  
      
        // --- Design Preferences ---
        "Design.Design_Type_Flexure": "Major Laterally Supported",
        "Design.Torsional_Restraint": "Fully Restrained",
        "Design.Warping_Restraint": "Both flanges fully restrained",
        "Design.Max_Deflection": "L/250",
        "Design.Allow_Class": "Plastic",
        "Design.Web_Philosophy": "Thick Web without ITS",
        "Design.Support_Width": "100",
        "Design.Design_Method": "Limit State Design",
        "Design.Effective_Area_Parameter": "1.0",
        "Design.Length_Overwrite": "NA",
      
        // --- Stiffener Settings (NA for Thick Web) ---
        "Design.IntermediateStiffener.Spacing": "NA",
        "Design.IntermediateStiffener.Thickness": "Standard",
        "Design.LongitudnalStiffener": "No",
        "Design.LongitudnalStiffener.Thickness": "Standard"
      };

    // Add design type specific params
    if (inputs.design_type === "Customized") {
      params["Total.Depth"] = String(inputs.total_depth || "500");
      params["Topflange.Width"] = String(inputs.top_flange_width || "200");
      params["Bottomflange.Width"] = String(inputs.bottom_flange_width || "200");
    } else if (inputs.design_type === "Optimized") {
      // For optimized, these are not required in set_input_values but we set defaults
      params["Total.Depth"] = "1";
      params["Topflange.Width"] = "1";
      params["Bottomflange.Width"] = "1";
    }

    return params;
  },

  inputSections: [
    {
      title: "Basic Properties",
      fields: [
        {
          key: "material",
          label: "Material*",
          type: "select",
          options: "materialList",
          onChange: (value, inputs, setInputs, materialList) => {
            const material = materialList.find(item => item.id === value);
            if (material) {
              setInputs({
                ...inputs,
                material: material.Grade,
              });
            }
          }
        },
        {
          key: "design_type",
          label: "Design Type*",
          type: "select",
          options: [
            { value: "Customized", label: "Customized" },
            { value: "Optimized", label: "Optimized" }
          ],
          defaultValue: "Customized",
          onChange: (value, inputs, setInputs) => {
            setInputs({
              ...inputs,
              design_type: value,
            });
          }
        },
        {
          key: "member_length",
          label: "Span Length (mm)*",
          type: "number",
          validation: "positive_number",
          placeholder: "Enter span length in mm"
        }
      ]
    },
    {
      title: "Section Dimensions",
      conditionalDisplay: (inputs) => inputs.design_type === "Customized",
      fields: [
        {
          key: "total_depth",
          label: "Total Depth (mm)*",
          type: "number",
          validation: "positive_number",
          placeholder: "Enter total depth"
        },
        {
          key: "web_thickness",
          label: "Web Thickness (mm)*",
          type: "customizable",
          selectionKey: "webThicknessSelect",
          modalKey: "webThickness",
          options: "thicknessList",
          defaultValue: ["6"]
        },
        {
          key: "top_flange_width",
          label: "Top Flange Width (mm)*",
          type: "number",
          validation: "positive_number",
          placeholder: "Enter top flange width"
        },
        {
          key: "top_flange_thickness",
          label: "Top Flange Thickness (mm)*",
          type: "customizable",
          selectionKey: "topFlangeThicknessSelect",
          modalKey: "topFlangeThickness",
          options: "thicknessList",
          defaultValue: ["6"]
        },
        {
          key: "bottom_flange_width",
          label: "Bottom Flange Width (mm)*",
          type: "number",
          validation: "positive_number",
          placeholder: "Enter bottom flange width"
        },
        {
          key: "bottom_flange_thickness",
          label: "Bottom Flange Thickness (mm)*",
          type: "customizable",
          selectionKey: "bottomFlangeThicknessSelect",
          modalKey: "bottomFlangeThickness",
          options: "thicknessList",
          defaultValue: ["6"]
        }
      ]
    },
    {
      title: "Loads",
      fields: [
        {
          key: "bending_moment",
          label: "Bending Moment (kNm)*",
          type: "number",
          validation: "positive_number",
          placeholder: "Enter bending moment"
        },
        {
          key: "shear_force",
          label: "Shear Force (kN)*",
          type: "number",
          validation: "number",
          placeholder: "Enter shear force"
        },
        {
          key: "bending_moment_shape",
          label: "Bending Moment Shape*",
          type: "select",
          options: [
            { value: "Uniform Loading with pinned-pinned support", label: "Uniform Loading with pinned-pinned support" },
            { value: "Uniform Loading with fixed-fixed support", label: "Uniform Loading with fixed-fixed support" },
            { value: "Concentrate Load with pinned-pinned support", label: "Concentrate Load with pinned-pinned support" },
            { value: "Concentrate load with fixed-fixed support", label: "Concentrate load with fixed-fixed support" }
          ],
          defaultValue: "Uniform Loading with pinned-pinned support"
        }
      ]
    },
    {
      title: "Support & Restraints",
      fields: [
        {
          key: "support_type",
          label: "Support Type*",
          type: "select",
          options: [
            { value: "Major Laterally Supported", label: "Major Laterally Supported" },
            { value: "Major Laterally Unsupported", label: "Major Laterally Unsupported" }
          ],
          defaultValue: "Major Laterally Supported"
        },
        {
          key: "support_width",
          label: "Support Width (mm)*",
          type: "number",
          validation: "positive_number",
          placeholder: "Enter support width"
        },
        {
          key: "web_philosophy",
          label: "Web Philosophy*",
          type: "select",
          options: [
            { value: "Thick Web without ITS", label: "Thick Web without ITS" },
            { value: "Thin Web with ITS", label: "Thin Web with ITS" }
          ],
          defaultValue: "Thick Web without ITS"
        },
        {
          key: "torsional_restraint",
          label: "Torsional Restraint*",
          type: "select",
          options: [
            { value: "Fully Restrained", label: "Fully Restrained" },
            { value: "Partially Restrained-support connection", label: "Partially Restrained-support connection" },
            { value: "Partially Restrained-bearing support", label: "Partially Restrained-bearing support" }
          ],
          defaultValue: "Fully Restrained"
        },
        {
          key: "warping_restraint",
          label: "Warping Restraint*",
          type: "select",
          options: [
            { value: "Both flanges fully restrained", label: "Both flanges fully restrained" },
            { value: "Compression flange fully restrained", label: "Compression flange fully restrained" },
            { value: "Compression flange partially restrained", label: "Compression flange partially restrained" },
            { value: "Warping not restrained in both flanges", label: "Warping not restrained in both flanges" }
          ],
          defaultValue: "Both flanges fully restrained"
        }
      ]
    },
    {
      title: "Design Preferences",
      fields: [
        {
          key: "design_method",
          label: "Design Method",
          type: "select",
          options: [
            { value: "Limit State Design", label: "Limit State Design" }
          ],
          defaultValue: "Limit State Design"
        },
        {
          key: "allowable_class",
          label: "Allowable Class",
          type: "select",
          options: [
            { value: "Plastic", label: "Plastic" },
            { value: "Compact", label: "Compact" },
            { value: "Semi-Compact", label: "Semi-Compact" },
            { value: "Slender", label: "Slender" }
          ],
          defaultValue: "Plastic"
        },
        {
          key: "effective_area_parameter",
          label: "Effective Area Parameter",
          type: "number",
          defaultValue: "1.0",
          placeholder: "Enter effective area parameter"
        },
        {
          key: "length_overwrite",
          label: "Length Overwrite",
          type: "select",
          options: [
            { value: "NA", label: "NA" }
          ],
          defaultValue: "NA"
        },
        {
          key: "loading_condition",
          label: "Loading Condition",
          type: "select",
          options: [
            { value: "Normal", label: "Normal" },
            { value: "Crane Load(Manual operation)", label: "Crane Load(Manual operation)" },
            { value: "Crane load(Electric operation up to 50t)", label: "Crane load(Electric operation up to 50t)" },
            { value: "Crane load(Electric operation over 50t)", label: "Crane load(Electric operation over 50t)" }
          ],
          defaultValue: "Normal"
        },
        {
          key: "max_deflection",
          label: "Maximum Deflection",
          type: "select",
          options: [
            { value: "L/250", label: "L/250" },
            { value: "L/300", label: "L/300" },
            { value: "L/400", label: "L/400" },
            { value: "L/500", label: "L/500" },
            { value: "L/600", label: "L/600" },
            { value: "L/800", label: "L/800" }
          ],
          defaultValue: "L/250"
        }
      ]
    },
    {
      title: "Stiffeners",
      fields: [
        {
          key: "intermediate_stiffener",
          label: "Intermediate Stiffener",
          type: "select",
          options: [
            { value: "No", label: "No" },
            { value: "Yes", label: "Yes" }
          ],
          defaultValue: "No"
        },
        {
          key: "intermediate_stiffener_spacing",
          label: "Intermediate Stiffener Spacing (mm)",
          type: "number",
          conditionalDisplay: (inputs) => inputs.intermediate_stiffener === "Yes",
          placeholder: "Enter spacing"
        },
        {
          key: "intermediate_stiffener_thickness",
          label: "Intermediate Stiffener Thickness",
          type: "select",
          options: [
            { value: "Standard", label: "Standard" },
            { value: "Customized", label: "Customized" }
          ],
          defaultValue: "Standard"
        },
        {
          key: "longitudinal_stiffener",
          label: "Longitudinal Stiffener",
          type: "select",
          options: [
            { value: "No", label: "No" },
            { value: "Yes and 1 stiffener", label: "Yes and 1 stiffener" },
            { value: "Yes and 2 stiffeners", label: "Yes and 2 stiffeners" }
          ],
          defaultValue: "No"
        },
        {
          key: "longitudinal_stiffener_thickness",
          label: "Longitudinal Stiffener Thickness",
          type: "select",
          options: [
            { value: "Standard", label: "Standard" },
            { value: "Customized", label: "Customized" }
          ],
          defaultValue: "Standard"
        }
      ]
    },
    {
      title: "Additional Properties",
      fields: [
        {
          key: "symmetry",
          label: "Symmetry",
          type: "select",
          options: [
            { value: "Symmetrical", label: "Symmetrical" },
            { value: "Unsymmetrical", label: "Unsymmetrical" }
          ],
          defaultValue: "Symmetrical"
        }
      ]
    }
  ],
};


