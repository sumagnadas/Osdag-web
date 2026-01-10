/* eslint-disable react/prop-types */
import React from "react";
import { useContext, useRef, useState, useEffect } from "react";
import { UserContext } from "../../../context/UserState";
import { useEngineeringService } from "../hooks/useEngineeringService";
import { MODULE_KEY_FIN_PLATE } from '../../../constants/DesignKeys';
import { message } from 'antd';
import { useLocation } from 'react-router-dom';
import { apiBase } from "../../../api";

// Module-specific configurations
const MODULE_CONFIGS = {
  [MODULE_KEY_FIN_PLATE]: {
    connectivityField: "Connectivity",
    connectivityMap: {
      "Column Flange-Beam-Web": "Column Flange-Beam Web",
      "Column Web-Beam-Web": "Column Web-Beam Web",
      "Beam-Beam": "Beam-Beam",
    },
    connectivityMapInverse: {
      "Column Flange-Beam Web": "Column Flange-Beam-Web",
      "Column Web-Beam Web": "Column Web-Beam-Web",
      "Beam-Beam": "Beam-Beam",
    },
    fields: {
      memberSupported: "Member.Supported_Section.Designation",
      memberSupporting: "Member.Supporting_Section.Designation",
      plateThickness: "Connector.Plate.Thickness_List",
      angleList: "Connector.Angle_List",
      topAngleList: "Connector.Top_Angle_List",
    },
    conditionalLogic: (selectedOption, inputs) => {
      const connectivity = MODULE_CONFIGS[MODULE_KEY_FIN_PLATE].connectivityMap[selectedOption];
      if (connectivity === "Column Flange-Beam Web" || connectivity === "Column Web-Beam Web") {
        return {
          memberSupported: inputs.beam_section,
          memberSupporting: inputs.column_section,
        };
      } else {
        return {
          memberSupported: inputs.secondary_beam,
          memberSupporting: inputs.primary_beam,
        };
      }
    }
  },
  "Beam-to-Beam End Plate Connection": {
    connectivityField: "Connectivity",
    endPlateField: "EndPlateType",
    connectivityMap: {
      "Flushed - Reversible Moment": "Flushed - Reversible Moment",
      "Extended One Way - Irreversible Moment": "Extended One Way - Irreversible Moment",
      "Extended Both Ways - Reversible Moment": "Extended Both Ways - Reversible Moment",
    },
    fields: {
      memberDesignation: "Member.Supported_Section.Designation",
      memberMaterial: "Member.Supported_Section.Material",
      plateThickness: "Connector.Plate.Thickness_List",
      weldFab: "Weld.Fab",
      weldMaterial: "Weld.Material_Grade_OverWrite",
      weldType: "Weld.Type",
    }
  },
  "Beam-to-Beam Cover Plate Bolted Connection": {
    fields: {
      memberDesignation: "Member.Designation",
      memberMaterial: "Member.Material",
      flangePreferences: "Connector.Flange_Plate.Preferences",
      flangePlateThickness: "Connector.Flange_Plate.Thickness_list",
      webPlateThickness: "Connector.Web_Plate.Thickness_List",
    }
  }
};

function UnifiedDropdownMenu({
  label,
  dropdown,
  setDesignPrefModalStatus,
  inputs,
  allSelected,
  setInputs,
  setAllSelected = () => { },
  logs,
  setCreateDesignReportBool,
  setSaveInputFileName,
  triggerScreenshotCapture,
  selectedOption = null,
  setSelectedOption = () => { },
  moduleType, // "FinPlateConnection" | "endplate" | "coverplate"
  currentProjectId,
  boltDiameterList = [],
  propertyClassList = [],
  thicknessList = [],
  angleList = [],
  topAngleList = [],
  openOptiGraph = () => { }
}) {
  const service = useEngineeringService();
  const { SaveInputValueFile } = useContext(UserContext);
  const BASE_URL = `${apiBase}`;
  const getAccessToken = () => localStorage.getItem('access') || localStorage.getItem('token') || '';
  const location = useLocation();
  const getProjectIdFromUrl = () => {
    const params = new URLSearchParams(location.search);
    const pid = params.get('projectId');
    return pid ? parseInt(pid, 10) : null;
  };


  const [isOpen, setIsOpen] = useState(false);
  const parentRef = useRef(null);

  // Get module configuration based on module name from inputs
  const getModuleConfig = () => {
    const moduleName = inputs?.module;
    return MODULE_CONFIGS[moduleName] || {};
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const loadInput = () => {
    let element = document.createElement("input");
    element.setAttribute("type", "file");
    element.accept = ".osi,application/json";
    parentRef.current.appendChild(element);
    element.click();

    element.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${BASE_URL}open-osi/`, {
          method: 'POST',
          // headers: {
          //   'Authorization': `Bearer ${getAccessToken()}`,
          // },
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.success) {
          // data.inputs follows the backend schema — pass through
          setInputs(data.inputs || {});
          // reset flags conservatively
          setAllSelected({});
          message.success('Input loaded from OSI');
        } else {
          message.error(data.error || 'Failed to open OSI');
        }
      } catch (err) {
        message.error('Failed to open OSI');
      } finally {
        // Ensure we remove the temporary input element after handling the file
        if (parentRef.current && element && parentRef.current.contains(element)) {
          parentRef.current.removeChild(element);
        }
      }
    });
  };

  const buildContentString = () => {
    let content = "";
    const moduleConfig = getModuleConfig();
    const moduleName = inputs.module;

    // Basic bolt and connector fields
    content += `Bolt.Bolt_Hole_Type: ${inputs.bolt_hole_type}\n`;
    content += `Bolt.Diameter:\n${formatArrayForText(
      allSelected.bolt_diameter ? boltDiameterList : inputs.bolt_diameter
    )}\n`;
    content += `Bolt.Grade:\n${formatArrayForText(
      allSelected.bolt_grade ? propertyClassList : inputs.bolt_grade
    )}\n`;
    content += `Bolt.Slip_Factor: ${inputs.bolt_slip_factor}\n`;
    content += `Bolt.TensionType: ${inputs.bolt_tension_type}\n`;
    content += `Bolt.Type: ${inputs.bolt_type.replaceAll("_", " ")}\n`;

    // Module-specific connectivity handling
    if (moduleName === MODULE_KEY_FIN_PLATE) {
      content += `Connectivity: ${moduleConfig.connectivityMap[selectedOption]}\n`;
    } else if (moduleName === "Beam-to-Beam End Plate Connection") {
      content += `Connectivity *: ${inputs.connectivity}\n`;
      content += `EndPlateType: ${moduleConfig.connectivityMap[selectedOption]}\n`;
    }

    content += `Connector.Material: ${inputs.connector_material}\n`;
    content += `Design.Design_Method: ${inputs.design_method}\n`;
    content += `Detailing.Corrosive_Influences: ${inputs.detailing_corr_status}\n`;
    content += `Detailing.Edge_type: ${inputs.detailing_edge_type}\n`;
    content += `Detailing.Gap: ${inputs.detailing_gap}\n`;
    content += `Load.Axial: ${inputs.load_axial || ""}\n`;
    content += `Load.Shear: ${inputs.load_shear || ""}\n`;

    if (inputs.load_moment !== undefined) {
      content += `Load.Moment: ${inputs.load_moment || ""}\n`;
    }

    content += `Material: ${inputs.material || inputs.connector_material}\n`;
    content += `Module: ${inputs.module}\n`;

    // Module-specific member designation handling
    if (moduleName === MODULE_KEY_FIN_PLATE) {
      const memberData = moduleConfig.conditionalLogic(selectedOption, inputs);
      content += `Member.Supported_Section.Designation: ${memberData.memberSupported}\n`;
      content += `Member.Supported_Section.Material: ${inputs.supported_material}\n`;
      content += `Member.Supporting_Section.Designation: ${memberData.memberSupporting}\n`;
      content += `Member.Supporting_Section.Material: ${inputs.supporting_material}\n`;
    } else if (moduleName === "Beam-to-Beam End Plate Connection") {
      content += `Member.Supported_Section.Designation: ${inputs.supported_designation}\n`;
      content += `Member.Supported_Section.Material: ${inputs.supported_material}\n`;
    } else if (moduleName === "Beam-to-Beam Cover Plate Bolted Connection") {
      content += `Member.Designation: ${inputs.member_designation}\n`;
      content += `Member.Material: ${inputs.member_material}\n`;
      content += `Connector.Flange_Plate.Preferences: ${inputs.flange_plate_preferences}\n`;
    }

    // Weld information (not for cover plate bolted)
    if (moduleName !== "Beam-to-Beam Cover Plate Bolted Connection") {
      content += `Weld.Fab: ${inputs.weld_fab}\n`;
      content += `Weld.Material_Grade_OverWrite: ${inputs.weld_material_grade}\n`;
      if (inputs.weld_type) {
        content += `Weld.Type: ${inputs.weld_type}\n`;
      }
    }

    // Thickness lists based on module
    if (inputs.plate_thickness) {
      content += `Connector.Plate.Thickness_List:\n${formatArrayForText(
        allSelected.plate_thickness ? thicknessList : inputs.plate_thickness
      )}\n`;
    }
    if (inputs.flange_plate_thickness) {
      content += `Connector.Flange_Plate.Thickness_list:\n${formatArrayForText(
        allSelected.flange_plate_thickness ? thicknessList : inputs.flange_plate_thickness
      )}\n`;
    }
    if (inputs.web_plate_thickness) {
      content += `Connector.Web_Plate.Thickness_List:\n${formatArrayForText(
        allSelected.web_plate_thickness ? thicknessList : inputs.web_plate_thickness
      )}\n`;
    }
    if (inputs.angle_list) {
      content += `Connector.Angle_List:\n${formatArrayForText(
        allSelected.angle_list ? angleList : inputs.angle_list
      )}\n`;
    }
    if (inputs.topangle_list) {
      content += `Connector.Top_Angle_List:\n${formatArrayForText(
        allSelected.topangle_list ? topAngleList : inputs.topangle_list
      )}\n`;
    }

    return content;
  };

  const downloadInput = () => {
    const content = buildContentString();
    let element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:application/json;charset=utf-8," + encodeURIComponent(content)
    );
    element.setAttribute("download", "input_osdag.osi");
    element.style.display = "none";
    parentRef.current.appendChild(element);
    element.click();
    parentRef.current.removeChild(element);
  };

  const saveInput = async () => {
    if (localStorage.getItem("userType") !== "user") {
      alert("Cannot save, user is not logged in");
      return;
    }
    // Determine module_id; try inputs.module or selected module key
    const module_id = inputs?.module || MODULE_KEY_FIN_PLATE;
    // Ensure projectId is present to link OSI to project
    const pid = getProjectIdFromUrl();
    if (!pid) {
      message.warning('No active project. Open or create a project first.');
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}save-osi-from-inputs/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ name: (inputs?.project_name || inputs?.name || 'project'), module_id, inputs }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // setDisplaySaveInputPopup(true);
        const savedName = (inputs?.project_name || inputs?.name || 'project');
        setSaveInputFileName(data?.data?.id ? `${savedName}.osi` : savedName);
        message.success('Saved OSI and project created');
        // Update project's osi_file_path via projectId from URL
        if (pid && data.url) {
          try {
            const upd = await fetch(`${BASE_URL}api/projects/${pid}/`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessToken()}`,
              },
              body: JSON.stringify({ osi_file_path: data.url }),
            });
            const updData = await upd.json();

            if (!upd.ok || !updData.success) {
              message.warning('Saved OSI, but failed to link to project');
            }
            setIsOpen(false);
          } catch (_e) {
            message.warning('Saved OSI, but failed to link to project');
          }
        }
      } else {
        message.error(data.error || 'Failed to save OSI');
      }
    } catch (err) {
      message.error('Failed to save OSI');
    }
  };

  const saveLogMessages = () => {
    if (!logs) {
      alert("No logs to save.");
      return;
    }

    let logsArr = [];
    let flag = false;

    for (const log of logs) {
      if (log.msg === "=== End Of Design ===") {
        flag = true;
        continue;
      }
      logsArr.push(`${log.type}: ${log.msg}`);
    }
    if (flag) logsArr.push(`INFO: === End Of Design ===`);

    const content = logsArr.join("\n");
    let element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:application/json;charset=utf-8," + encodeURIComponent(content)
    );
    element.setAttribute("download", "logs_osdag.osi");
    element.style.display = "none";
    parentRef.current.appendChild(element);
    element.click();
    parentRef.current.removeChild(element);   
  };

  const handleClick = (option) => {
    switch (option.name) {
      case "Load Input":
        loadInput();
        break;
      // case "Download Input":
      //   downloadInput();
      //   break;
      case "Save Input":
        saveInput();
        break;
      case "Save Log Messages":
        saveLogMessages();
        break;
      case "Create Design Report":
        setCreateDesignReportBool(true);
        break;
      case "Save 3D Model":
        (async () => {
          try {
            const options = {
              types: [
                {
                  description: "OBJ File",
                  accept: { "application/octet-stream": [".obj"] },
                },
                {
                  description: "BREP File",
                  accept: { "application/octet-stream": [".brep"] },
                },
                {
                  description: "STEP File",
                  accept: { "application/octet-stream": [".step"] },
                },
                {
                  description: "IGES File",
                  accept: { "application/octet-stream": [".iges"] },
                },
              ],
              suggestedName: "3dmodel",
            };

            const handle = await window.showSaveFilePicker(options);
            const fileExtension = handle.name.split(".").pop();
            const result = await service.downloadCADModel(fileExtension);
            const blob = result.success ? result.blob : null;

            if (blob) {
              const writable = await handle.createWritable();
              await writable.write(blob);
              await writable.close();
              // CAD file saved successfully
              message.success(`${fileExtension.toUpperCase()} CAD file saved successfully.`);
            } else {
              console.error("Failed to download CAD model blob.");
            }
          } catch (error) {
            console.error("Save 3D model cancelled or failed", error);
          }
        })();
        break;
      case "Save Cad Image":
        triggerScreenshotCapture();
        break;
      case "Design Preferences":
        setDesignPrefModalStatus(true);
        break;
      case "Open Optimization Graph":
        openOptiGraph();
        break;
      default:
        // Default value
        setInputs({
          ...inputs,
          // [inputKey]: option.name,
          graphicsOption: option.name,
        });
        break;
    }
  };

  // UTILITY FUNCTIONS
  const formatArrayForText = (arr) => {
    if (!arr || arr.length === 0) return "";
    let text = "";
    for (let i = 0; i < arr.length; i++) {
      if (i !== arr.length - 1) text += `- '${arr[i]}'\n`;
      else text += `- '${arr[i]}'`;
    }
    return text;
  };

  const getFormatedArrayFields = (arr, index) => {
    let res = [];
    for (let i = index + 1; i < arr.length; i++) {
      const line = arr[i].trim();
      if (!line.startsWith("-")) break;

      const match = line.match(/'([^']+)'/);
      if (match) {
        res.push(match[1]);
      }
    }
    return res;
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (parentRef.current && !parentRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("click", handleOutsideClick);
    return () => {
      window.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  return (
    <div className="relative flex justify-center items-center hover:bg-[#91b014] hover:text-white p-1" ref={parentRef}>
      <div
        className="font-medium  cursor-pointer"
        onClick={handleToggle}
      >
        {label}
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 bg-white border border-[#ccc] border-t-0 min-w-[350px] z-[1]">
          {dropdown.map((option, index) => (
            <div
              className="flex w-full justify-between text-sm text-black hover:text-white hover:bg-osdag-green cursor-pointer p-1"
              key={index}
              onClick={() => handleClick(option)}
            >
              {option.name}
              {option.shortcut && (
                <span className="shortcut">{option.shortcut}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>

  );
}

export default UnifiedDropdownMenu;
