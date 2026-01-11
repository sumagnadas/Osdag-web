
import React, { useRef, useState, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Html, PerspectiveCamera } from "@react-three/drei";
import { useNavigate, useLocation } from "react-router-dom";
import { Modal, Button } from "antd";
import { useEngineeringModule } from "../hooks/useEngineeringModule";
import {
  MODULE_KEY_FIN_PLATE,
  MODULE_KEY_CLEAT_ANGLE,
  MODULE_KEY_END_PLATE,
  MODULE_KEY_SEAT_ANGLE,
  MODULE_KEY_BEAM_COLUMN_END_PLATE,
} from "../../../constants/DesignKeys";
import { BaseInputDock } from "./BaseInputDock";
import { BaseOutputDock } from "./BaseOutputDock";
import { CustomizationModal } from "../components/CustomizationModal";
import { DesignReportModal } from "../components/DesignReportModal";
import useViewCamera from "./btobViewCamera";
import Model from "./CadViewer";
import Logs from "../../../components/Logs";
import UnifiedDropdownMenu from "../utils/UnifiedDropdownMenu";
import ScreenshotCapture from "../../../components/ScreenShotCapture";
import DesignPrefSections from "../../../components/DesignPrefSections";
import GridSelector from "../utils/GridSelector";
import { message, Modal as AntdModal } from 'antd';
import { menuItems } from "../utils/moduleUtils";
import { UI_STRINGS } from "../../../constants/UIStrings";
import { isGuestUser } from "../../../utils/auth";
import OptimizationGraph from "./OptimizationGraph";

export const EngineeringModule = ({
  moduleConfig,
  outputConfig,
  title,
}) => {
  const isGuest = isGuestUser;
  const navigate = useNavigate();
  const cameraRef = useRef();
  const lockBtnRef = useRef(null);

  const {
    // Module data
    beamList,
    columnList,
    connectivityList,
    materialList,
    boltDiameterList,
    thicknessList,
    propertyClassList,
    angleList,
    boltTypeList,
    sectionProfileList,
    channelList,
    sectionDesignation,
    cadModelPaths,
    hoverDict: ctxHoverDict,
    coverPlateList,
    weldSizeList,

    // State
    inputs,
    setInputs,
    output,
    logs,
    loading,
    renderBoolean,
    modelKey,
    modalStates,
    selectionStates,
    allSelected,
    selectedItems,
    saveOutput,
    createDesignReportBool,
    setCreateDesignReportBool,
    designReportInputs,
    setDesignReportInputs,
    designPrefModalStatus,
    setDesignPrefModalStatus,
    confirmationModal,
    setConfirmationModal,
    displaySaveInputPopup,
    saveInputFileName,
    selectedView,
    setSelectedView,
    screenshotTrigger,
    setScreenshotTrigger,
    extraState,
    setExtraState,
    modalDynamicSrc,
    setModalDynamicSrc,

    // Navigation and Reset states
    showResetConfirmation,
    setShowResetConfirmation,
    confirmationType,
    setConfirmationType,
    isLoadingModalVisible,
    setIsLoadingModalVisible,
    loadingStage,
    setLoadingStage,

    // Actions
    updateModalState,
    updateSelectionState,
    updateSelectedItems,
    toggleAllSelected,
    handleSubmit,
    handleReset,
    handleHomeClick,
    performReset,
    handleCreateDesignReport,
    handleOkDesignReport,
    handleCancelDesignReport,
    clearDesignResults,
    
    // Service API (for project/OSI operations)
    service,
  } = useEngineeringModule(moduleConfig);

  const [showResetButton, setShowResetButton] = useState(false);
  const [showInputDock, setShowInputDock] = useState(true);
  const [showOutputDock, setShowOutputDock] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [isDesignComplete, setIsDesignComplete] = useState(false);
  const [isInputLocked, setIsInputLocked] = useState(false);
  const [showUnlockWarning, setShowUnlockWarning] = useState(false);
  const [showOptionsContainer, setShowOptionsContainer] = useState(false); // New state for options container
  const [isGridActive, setIsGridActive] = useState(false);
  const [isRedesigning, setIsRedesigning] = useState(false); // New state for re-design operations
  const [selectedSection, setSelectedSection] = useState(["Model"]);
  const [selectedCameraView, setSelectedCameraView] = useState("Model");
  const [lockZoom, setLockZoom] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [showOptimizationGraph, setShowOptimizationGraph] = useState(false);
  const [optimizationDone, setOptimizationDone] = useState(false);
  const [optimizationData, setOptimizationData] = useState({
    current_iter: 0,
    non_fease: {
      x: [],
      y: [],
      z: [],
    },
    fease: {
      x: [],
      y: [],
      z: [],
    },
    best: {
      iter: null,
      found: false,
      particle: null,
      x: [],
      y: [],
      z: []
    }
  });

  // Normalize CAD path keys to handle case/spacing differences
  const normalizedCadModelPaths = useMemo(() => {
    const out = {};
    Object.entries(cadModelPaths || {}).forEach(([key, value]) => {
      if (!key) return;
      const trimmed = key.trim();
      out[trimmed] = value;
      out[trimmed.toLowerCase()] = value;
      out[trimmed.toUpperCase()] = value;
    });
    return out;
  }, [cadModelPaths]);

  // Debug: log CAD paths when they change
  useEffect(() => {
    if (normalizedCadModelPaths) {
      const keys = Object.keys(normalizedCadModelPaths || {});
      console.log("[EngineeringModule] cadModelPaths keys:", keys);
      console.log("[EngineeringModule] selectedSection:", selectedSection);
    }
  }, [normalizedCadModelPaths, selectedSection]);

  // Detect landscape orientation for mobile
  useEffect(() => {
    const checkOrientation = () => {
      // Landscape: width > height and on mobile/tablet
      setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth < 768);
    };
    
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  // Hover tooltip state for 3D parts
  const [hoverText, setHoverText] = useState("");
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const location = useLocation();

  const getProjectIdFromUrl = () => {
    const params = new URLSearchParams(location.search);
    const pid = params.get('projectId');
    return pid ? parseInt(pid, 10) : null;
  };

  // Enforce project presence for authenticated users
  useEffect(() => {
    if (isGuestUser()) {
      console.info('[EngineeringModule] Guest mode detected: skipping project enforcement');
      return; // guests can open without a project
    }
    const projectId = getProjectIdFromUrl();
    if (!projectId || Number.isNaN(projectId)) {
      message.warning('No active project. Redirecting to home.');
      navigate('/');
      return;
    }
    (async () => {
      try {
        const result = await service.getProject(projectId);
        if (!result.success || !result.project) {
          message.warning('Project not found. Redirecting to home.');
          navigate('/');
          return;
        }
        // Prefill inputs from saved project when opening by id
        if (result.project.inputs_json) {
          try {
            setInputs(result.project.inputs_json);
          } catch (_ignored) {
            // ignore parse issues; user can overwrite via UI
          }
        }
      } catch (_e) {
        message.warning('Cannot verify project. Redirecting to home.');
        navigate('/');
      }
    })();
  }, [location.search, service, setInputs, navigate]);

  // Only change dock visibility after design is complete
  useEffect(() => {
    if (!loading && !isRedesigning && output && renderBoolean) {
      setIsDesignComplete(true);
      setShowOptionsContainer(true); // Show options container after design is complete

      // Auto-open output dock and logs on all viewports so results are visible immediately
      if (!showOutputDock) setShowOutputDock(true);
      if (!showLogs) setShowLogs(true);

      // Lock inputs after successful design
      setIsInputLocked(true);
    } else if (isRedesigning || loading) {
      setIsDesignComplete(false);
      setShowOptionsContainer(false);
      setIsInputLocked(false);
    }
  }, [loading, output, renderBoolean, isRedesigning, showOutputDock, showLogs]);

  const handleGridToggle = () => {
    setIsGridActive(!isGridActive);
  };

  // Handle orthographic view changes from GridSelector
  const handleOrthographicViewChange = (viewType) => {
    setSelectedCameraView(viewType);
  };

  // Check if this design uses optimized inputs and open graph
  const openOptiGraph = () => {
    if (extraState.optimizedInputs)
      setShowOptimizationGraph(!showOptimizationGraph);
  }

  const handleSubmitEnhanced = async () => {
    setIsInputLocked(false);
    // If there's already an existing design, completely reset everything
    if (isDesignComplete || renderBoolean || output) {

      // Immediately hide current model and output
      setIsRedesigning(true);
      setIsDesignComplete(false);
      setShowOutputDock(false);
      setShowLogs(false);
      setShowOptionsContainer(false);
      setSelectedSection(["Model"]);
      setSelectedCameraView("Model");

      // Reset all the data that controls model rendering
      await performReset();

      // Small delay to ensure reset is processed
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Call the actual submit function
    try {
      if (extraState.optimizedInputs) {
        let sequence = -1; // to track and drop out-of-order messages.
        setShowOptimizationGraph(true);
        service.getRTUpdates("ws/optimize/plate-girder/",
          (ev) => {
            const ws = ev.target
            ws.send(JSON.stringify({
              type: "start_optimization",
              data: inputs
            }
            ));

            setOptimizationData({
              current_iter: 0,
              non_fease: {
                x: [],
                y: [],
                z: [],
              },
              fease: {
                x: [],
                y: [],
                z: [],
              },
              best: {
                iter: null,
                found: false,
                particle: null,
                x: [],
                y: [],
                z: []
              }
            });
            setOptimizationDone(false);
          },
          (event) => {
            const msg = JSON.parse(event.data);
            if (msg.data.sequence > sequence) {
              sequence = msg.data.sequence;
              switch (msg.type) {
                case "task_started":
                  break;
                case "pso_update":
                  setOptimizationData((prev) => {
                    if (msg.data.ur < 1) {
                      return {
                        ...prev,
                        current_iter: msg.data.iteration,
                        fease: {
                          x: [...prev.fease.x, msg.data.ur],
                          y: [...prev.fease.y, msg.data.depth],
                          z: [...prev.fease.z, msg.data.weight_kg]
                        }
                      }
                    }
                    else {
                      return {
                        ...prev,
                        current_iter: msg.data.iteration,
                        non_fease: {
                          x: [...prev.non_fease.x, msg.data.ur],
                          y: [...prev.non_fease.y, msg.data.depth],
                          z: [...prev.non_fease.z, msg.data.weight_kg]
                        }
                      }
                    }

                  })
                  break;
                case "pso_heartbeat":
                  // update liveness indicator
                  break;
                case "pso_complete":
                  setOptimizationDone(true);
                  event.target.close(); // close the connection
                  // show final design; stop loading
                  break;
                case "pso_error":
                  console.lofg
                  event.target.close(); // close the connection
                  // show error; stop loading
                  break;
              }
            }
          }
        )
      }
      await handleSubmit();
      setShowResetButton(true);

      // Persist latest inputs to project after design
      if (!isGuestUser()) {
        const pid = getProjectIdFromUrl();
        if (pid && !Number.isNaN(pid)) {
          try {
            await service.updateProject(pid, { inputs_json: inputs });
          } catch (_e) {
            // ignore persistence errors; UI will still show outputs
          }
        }
      }
    } catch (error) {
    } finally {
      // Reset the redesigning state after completion
      setIsRedesigning(false);
    }
  };

  // Toggle reset button visibility
  const toggleResetButton = () => {
    setShowResetButton(!showResetButton);
  };

  // Toggle functions for SVG clicks
  const toggleInputDock = () => {
    // On mobile/tablet, close output dock if open
    if (window.innerWidth < 768) {
      if (showOutputDock) {
        setShowOutputDock(false);
      }
      // Close logs when dock opens on mobile
      if (showLogs) {
        setShowLogs(false);
      }
    }
    // Desktop: No dependencies, just toggle
    setShowInputDock((prev) => !prev);
  };

  const toggleOutputDock = () => {
    // Only check if output exists, not isDesignComplete
    if (!output) return;
    
    // On mobile/tablet, close input dock if open
    if (window.innerWidth < 768) {
      if (showInputDock) {
        setShowInputDock(false);
      }
      // Close logs when dock opens on mobile
      if (showLogs) {
        setShowLogs(false);
      }
    }
    // Desktop: No dependencies, just toggle
    setShowOutputDock((prev) => !prev);
  };

  const handleLockToggle = () => {
    if (isInputLocked) {
      // Show warning modal first
      setShowUnlockWarning(true);
    } else {
      setIsInputLocked(true);
      // Don't close the dock when locking - keep it open but locked
    }
  };

  const confirmUnlock = () => {
    clearDesignResults();
    setIsDesignComplete(false);
    setShowOptionsContainer(false);
    setShowOutputDock(false);
    setShowLogs(false);
    setSelectedSection(["Model"]);
    setSelectedCameraView("Model");
    setShowResetButton(false);
    setHoverText("");
    setHoverPos({ x: 0, y: 0 });
    setIsInputLocked(false);
    setShowInputDock(true);
    setIsRedesigning(false);
    setShowUnlockWarning(false);
  };

  const cancelUnlock = () => {
    setShowUnlockWarning(false);
    setIsInputLocked(true);
  };

  const toggleLogs = () => {
    // Only check if output exists
    if (!output) return;
    
    // On mobile/tablet, if any dock is open, close it first
    if (window.innerWidth < 768) {
      if (showInputDock) {
        setShowInputDock(false);
      }
      if (showOutputDock) {
        setShowOutputDock(false);
      }
    }
    // Desktop: No dependencies, just toggle
    setShowLogs((prev) => !prev);
  };

  const handleResetEnhanced = async () => {
    setShowResetConfirmation(true);
    setConfirmationType("reset");
  };

  const performResetEnhanced = async () => {
    performReset();
    setShowResetButton(false);
    setShowResetConfirmation(false);
    setShowOutputDock(false);
    setShowInputDock(true);
    setIsDesignComplete(false);
    setShowLogs(false); // Reset logs visibility
    setShowOptionsContainer(false); // Hide options container on reset
    setSelectedSection("Model"); // Reset selected section
    setSelectedCameraView("Model"); // Reset selected camera view
    setIsRedesigning(false); // Reset redesigning state
    setIsInputLocked(false);
  };
  // Save inputs to OSI file / Project (JSON-first)
  const handleSaveInputs = async () => {
    const userIsGuest = isGuest();

    // Determine module_id - use designType from moduleConfig, or fallback to inputs.module
    const module_id = moduleConfig?.designType || inputs?.module || moduleConfig?.cameraKey || MODULE_KEY_SEAT_ANGLE;
    const projectName = inputs?.project_name || inputs?.name || moduleConfig?.sessionName || 'project';

    try {
      // Expand inputs for any multi-selects where "All" is selected so arrays are populated
      const expandAllSelectedInputs = (baseInputs) => {
        const keyToFullListMap = {
          bolt_diameter: boltDiameterList,
          bolt_grade: propertyClassList,
          plate_thickness: thicknessList,
          flange_plate_thickness: thicknessList,
          web_plate_thickness: thicknessList,
          angle_list: angleList,
          topangle_list: angleList,
          cleat_section: angleList,
        };
        const expanded = { ...baseInputs };
        Object.keys(keyToFullListMap).forEach((inputKey) => {
          if (allSelected?.[inputKey]) {
            const fullList = keyToFullListMap[inputKey] || [];
            // Normalize values to strings like the UI does
            expanded[inputKey] = Array.isArray(fullList)
              ? fullList.map((val) => {
                if (typeof val === 'object' && val !== null) {
                  return val.value || val.Grade || String(val);
                }
                return String(val);
              })
              : [];
          }
        });
        return expanded;
      };

      const inputsForSave = expandAllSelectedInputs(inputs);
      if (userIsGuest) {
        // Guest: OSI download flow using service
        const result = await service.saveOSIFromInputs(projectName, module_id, inputsForSave, false);
        if (result.success && result.is_guest && result.content_base64) {
          try {
            const binaryString = atob(result.content_base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
            const blob = new Blob([bytes], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = result.filename || `${projectName}.osi`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            message.success('OSI file downloaded successfully');
          } catch (err) {
            console.error('Error downloading OSI file:', err);
            message.error('Failed to download OSI file');
          }
          return;
        }
        message.error(result.error || 'Failed to save inputs');
        return;
      }

      // Authenticated: persist inputs_json to project
      const projectId = getProjectIdFromUrl();
      if (!projectId || Number.isNaN(projectId)) {
        message.warning('No active project. Open or create a project first.');
        return;
      }
      const updateResult = await service.updateProject(projectId, { inputs_json: inputsForSave });
      if (!updateResult.success) {
        message.error(updateResult.error || 'Failed to save inputs');
        return;
      }

      // Also provide a local OSI download for logged-in users (same as guest)
      try {
        const saveResult = await service.saveOSIFromInputs(projectName, module_id, inputsForSave, true);
        if (saveResult.success && saveResult.content_base64) {
          const binaryString = atob(saveResult.content_base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
          const blob = new Blob([bytes], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = saveResult.filename || `${projectName}.osi`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          message.success('Inputs saved and OSI downloaded');
        } else {
          message.success('Inputs saved');
        }
      } catch (_e) {
        message.success('Inputs saved');
      }
    } catch (err) {
      console.error('Error saving inputs:', err);
      message.error('Failed to save inputs');
    }
  };

  // Get connectivity for FinPlateConnection module
  const getConnectivity = () => {
    if (moduleConfig.cameraKey === MODULE_KEY_FIN_PLATE) {
      return extraState?.selectedOption || inputs?.connectivity;
    }
    return null;
  };

  const cameraSettings = useViewCamera(
    moduleConfig.cameraKey,
    selectedCameraView,
    getConnectivity()
  );

  const {
    position: cameraPos,
    modelPosition,
    modelScale,
  } = cameraSettings;

  // Determine view options based on module config
  const getViewOptions = () => {
    if (moduleConfig.cadOptions) {
      return moduleConfig.cadOptions || ["Model", "Beam", "Connector"];
    }

    if (moduleConfig.cameraKey === MODULE_KEY_FIN_PLATE) {
      return ["Model", "Beam", "Column", "Plate"];
    }
    else if (moduleConfig.cameraKey === MODULE_KEY_CLEAT_ANGLE) {
      return ["Model", "Beam", "Column", "CleatAngle"]; // FIXED: Use CleatAngle instead of Connector
    }
    else if (moduleConfig.cameraKey === MODULE_KEY_END_PLATE) {
      return ["Model", "Beam", "Column", "Plate"];
    }
    else if (moduleConfig.cameraKey === MODULE_KEY_SEAT_ANGLE) {
      return ["Model", "Beam", "Column", "SeatedAngle"]; // FIXED: Use SeatedAngle instead of Connector
    }
    else if (moduleConfig.cameraKey === MODULE_KEY_BEAM_COLUMN_END_PLATE) {
      return ["Model", "Beam", "Column", "End Plate"];
    }

    return moduleConfig.cadOptions || ["Model", "Beam", "Connector"];
  };

  const options = getViewOptions();
  // FIXED: Include angleList in contextData 
  const contextData = {
    beamList,
    columnList,
    connectivityList,
    materialList,
    boltDiameterList,
    thicknessList,
    propertyClassList,
    angleList, // FIXED: Added angleList to context data
    boltTypeList,
    sectionProfileList,
    channelList,
    sectionDesignation,
    coverPlateList,
    weldSizeList,
  };

  const triggerScreenshotCapture = () => {
    setScreenshotTrigger(true);
  };

  // Default hover dictionary mapping per-part names to labels
  // Prioritize ctxHoverDict values from backend over defaults
  // Use useMemo to recalculate when ctxHoverDict changes
  const hoverDict = useMemo(() => {
    const defaults = {
      // Defaults (fallback if backend doesn't provide)
      Beam: "Beam",
      Column: "Column",
      Plate: "Plate",
      Weld: "Weld",
      Welds: "Welds",
      Bolt: "Bolt",
      Bolts: "Bolts",
      cleatAngle: "Cleat Angle",
      SeatedAngle: "Seated Angle",
      Connector: "Connector",
      EndPlate: "End Plate",
      Member: "Member",
      Angle: "Angle",
    };

    // Backend hover_dict values override defaults
    const final = {
      ...defaults,
      ...(ctxHoverDict || {}),
    };

    // Debug: log hoverDict to see what we have
    if (ctxHoverDict && Object.keys(ctxHoverDict).length > 0) {
      console.log('[EngineeringModule] ctxHoverDict:', ctxHoverDict);
      console.log('[EngineeringModule] Final hoverDict:', final);
    }

    return final;
  }, [ctxHoverDict]);

  // If backend provided bolt details but no separate Bolt mesh exists,
  // enrich the Plate hover to include bolt info as a fallback.
  const hasBoltMesh = Boolean(cadModelPaths?.Bolt || cadModelPaths?.Bolts);
  if (!hasBoltMesh && (ctxHoverDict && ctxHoverDict.Bolt)) {
    const boltText = String(ctxHoverDict.Bolt).replace(/<br\s*\/?>/gi, ' ');
    hoverDict.Plate = hoverDict.Plate ? `${hoverDict.Plate}: ${boltText}` : boltText;
  }

  const handleHoverLabel = (label, clientX, clientY) => {
    if (!label) return;
    if (typeof clientX === 'number' && typeof clientY === 'number') {
      setHoverPos({ x: clientX + 12, y: clientY + 12 });
    }
    setHoverText(label);
  };
  const handleHoverEnd = () => {
    setHoverText("");
  };

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden">
      {/* Navigation */}
      <div className="sticky top-0 z-[60] md:h-[15%] min-h-[48px] max-h-[80px] flex flex-row flex-wrap justify-center md:justify-between items-center bg-[#d2d4d2] gap-x-4 w-full text-sm flex-shrink-0 pl-4">
        <div className="flex flex-row flex-wrap justify-center md:justify-start items-center gap-x-4">
          {menuItems.map((item, index) => (
            <UnifiedDropdownMenu
              key={index}
              label={item.label}
              dropdown={item.dropdown}
              setDesignPrefModalStatus={setDesignPrefModalStatus}
              inputs={inputs}
              setInputs={setInputs}
              allSelected={allSelected}
              logs={logs}
              setCreateDesignReportBool={setCreateDesignReportBool}
              triggerScreenshotCapture={triggerScreenshotCapture}
              selectedOption={extraState.selectedOption}
              openOptiGraph={openOptiGraph}
              setSelectedOption={(value) =>
                setExtraState({ ...extraState, selectedOption: value })
              }
            />
          ))}

          {displaySaveInputPopup && (
            <span id="save-input-style" style={{ marginTop: "18px" }}>
              <strong>Saved input file as "{saveInputFileName}"</strong>
            </span>
          )}
        </div>

        <div className="flex flex-row flex-wrap justify-center items-center gap-2 text-black dark:text-white pr-4">

          {/* Input Dock Button */}
          <button
            onClick={toggleInputDock}
            className={`group p-2 md:p-2 min-w-[44px] min-h-[44px] rounded-md transition-colors ${showInputDock
              ? 'bg-osdag-green text-white dark:bg-osdag-dark-green'
              : 'hover:bg-black/10 dark:hover:bg-black/40'
              }`}
            title={`${showInputDock ? 'Hide' : 'Show'} input dock`}
            type="button"
          >
            <svg viewBox="0 0 100 100" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="6">
              {/* Frame */}
              <rect x="8" y="8" width="84" height="84" />
              {/* Divider line */}
              <line x1="38" y1="8" x2="38" y2="92" />
              {/* LEFT panel fill only when active */}
              {showInputDock && (
                <rect x="8" y="8" width="30" height="84" fill="currentColor" stroke="none" />
              )}
            </svg>

          </button>

          {/* Logs Button */}
          <button
            onClick={toggleLogs}
            className={`p-2 md:p-2 min-w-[44px] min-h-[44px] rounded-md transition-colors ${showLogs
              ? 'bg-osdag-green text-white dark:bg-osdag-dark-green'
              : 'hover:bg-black/10 hover:text-osdag-green dark:hover:bg-black/40'
              }`}
            title={`${showLogs ? 'Hide' : 'Show'} logs`}
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              className="w-5 h-5"
            >
              {/* Outer border */}
              <rect
                x="5"
                y="5"
                width="90"
                height="90"
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
              />

              {/* Bottom section fill */}
              <rect
                x="5"
                y="65"
                width="90"
                height="30"
                fill="currentColor"
                stroke="none"
              />
            </svg>
          </button>

          {/* Output Dock Button */}
          <button
            onClick={toggleOutputDock}
            disabled={!output}
            title={output ? `${showOutputDock ? 'Hide' : 'Show'} output dock` : 'Run a design to view outputs'}
            type="button"
            className={`p-2 md:p-2 min-w-[44px] min-h-[44px] rounded-md transition-colors ${output
                ? (showOutputDock ? 'bg-osdag-green text-white dark:bg-osdag-dark-green' : 'hover:bg-black/10 dark:hover:bg-black/40')
                : "opacity-40 cursor-not-allowed"
              }`}
          >
            <svg viewBox="0 0 100 100" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="6">
              {/* Frame */}
              <rect x="8" y="8" width="84" height="84" />
              {/* Divider line */}
              <line x1="62" y1="8" x2="62" y2="92" />
              {/* RIGHT panel fill only when active */}
              {showOutputDock && (
                <rect x="62" y="8" width="30" height="84" fill="currentColor" stroke="none" />
              )}
            </svg>
          </button>
          {/* home */}
          <button
            onClick={() => navigate('/home')}
            title="Home"
            type="button"
            className="p-2 md:p-2 min-w-[44px] min-h-[44px] rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </button>
          {/* theme mode */}
          <button
            onClick={toggleTheme}
            className="p-2 md:p-2 min-w-[44px] min-h-[44px] text-black transition-colors dark:text-white"
          >
            {isDark ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="currentColor"
              >
                <path d="M480-360q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm0 80q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480q0 83-58.5 141.5T480-280ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Zm326-268Z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21.64 13.64a1 1 0 00-1.05-.24 8 8 0 01-10-10 1 1 0 00-.24-1.05A1 1 0 008.73 2 10 10 0 1022 15.27a1 1 0 00-.36-1.63z" />
              </svg>
            )}
          </button>
          
        </div>

        {/* Initial theme detection, run once per mount */}
        {React.useEffect(() => {
          const saved = localStorage.getItem('osdag-theme');
          if (saved === 'dark') {
            document.body.classList.add('dark');
          } else if (saved === 'light') {
            document.body.classList.remove('dark');
          }
        }, [])}
      </div>

      <div className="relative flex flex-row h-full w-full" style={{ minHeight: 'calc(100vh - 80px)', maxHeight: 'calc(100vh - 48px)' }}> {/* Adjust for nav height */}
        {/* Input Dock Toggle Button - Fixed to left, shows when dock is closed (Desktop only) */}
        {!showInputDock && (
          <button
            onClick={toggleInputDock}
            className="hidden md:flex absolute left-0 top-0 h-full w-8 bg-white dark:bg-osdag-dark-color border-r border-gray-300 dark:border-osdag-border items-center justify-center z-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
            title="Open Input Dock"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
            </svg>
          </button>
        )}

        {/* Output Dock Toggle Button - Fixed to right, shows when dock is closed and output exists (Desktop only) */}
        {!showOutputDock && output && (
          <button
            onClick={toggleOutputDock}
            className="hidden md:flex absolute right-0 top-0 h-full w-8 bg-white dark:bg-osdag-dark-color border-l border-gray-300 dark:border-gray-700 items-center justify-center z-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
            title="Open Output Dock"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor">
              <path d="M15.41 7.41L10.83 12l4.58 4.59L14 18l-6-6 6-6 1.41 1.41z" />
            </svg>
          </button>
        )}

        {/* Left - Input Dock - Only show if showInputDock is true */}
        {showInputDock && (
          <BaseInputDock
            moduleConfig={moduleConfig}
            inputs={inputs}
            setInputs={setInputs}
            isInputLocked={isInputLocked}
            lockBtnRef={lockBtnRef}
            lockZoom={lockZoom}
            setLockZoom={setLockZoom}
            showUnlockWarning={showUnlockWarning}
            confirmUnlock={confirmUnlock}
            cancelUnlock={cancelUnlock}
            handleSaveInputs={handleSaveInputs}
            handleSubmitEnhanced={handleSubmitEnhanced}
            isGuest={isGuest}
            setDesignPrefModalStatus={setDesignPrefModalStatus}
            handleLockToggle={handleLockToggle}
            selectionStates={selectionStates}
            updateSelectionState={updateSelectionState}
            updateModalState={updateModalState}
            toggleAllSelected={toggleAllSelected}
            contextData={contextData}
            extraState={extraState}
            setExtraState={setExtraState}
            updateSelectedItems={updateSelectedItems}
            setModalDynamicSrc={setModalDynamicSrc}
          />
        )}

        {/* Middle - 3D Model/PSO Optimization Graph */}
        {(<div className="flex-1 flex flex-col relative min-w-0">
          {/* Options Container - Show after design is complete. On desktop, show even when docks are open. On mobile, only show when docks are closed */}
          {showOptionsContainer && output && (window.innerWidth >= 768 || (!showInputDock && !showOutputDock)) && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-40 flex flex-wrap justify-center items-center gap-2 p-2 bg-white/90 dark:bg-osdag-dark-color/90 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md">
              <div className="flex flex-wrap justify-center items-center gap-2">
                {options.map((option) => {
                  const isChecked = selectedSection.includes(option);
                  const isModel = option === "Model";
                  return (
                    <label
                      key={option}
                      className={`flex items-center gap-3 px-4 py-2 cursor-pointer text-sm font-medium text-black dark:text-white`}
                    // rounded-lg cursor-pointer transition-colors text-sm font-medium ${isChecked ? 'bg-osdag-green/10 text-osdag-green dark:bg-osdag-dark-green/20 dark:text-osdag-green' : 'text-black dark:text-white hover:bg-black/10 dark:hover:bg-black/40'}`}
                    >
                      {/* Checkbox highlight box */}
                      <div
                        className={`
                          rounded-lg p-1 transition-colors
                          ${isChecked
                            ? "bg-osdag-green/20 dark:bg-osdag-dark-green/30"
                            : "bg-transparent"
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-400 text-osdag-green focus:ring-osdag-green"
                          checked={isChecked}
                          onChange={(event) => {
                            if (isModel) {
                              // If Model is selected, clear all others and select only Model
                              if (event.target.checked) {
                                setSelectedSection(["Model"]);
                                setSelectedView("Model");
                                setSelectedCameraView("Model");
                              } else {
                                // Don't allow unchecking Model if it's the only one
                                if (selectedSection.length === 1 && selectedSection[0] === "Model") {
                                  return;
                                }
                              }
                            } 
                            else {
                              // If a non-Model option is selected
                              if (event.target.checked) {
                                // Remove Model from selection and add this option
                                const newSelection = selectedSection.filter(s => s !== "Model");
                                if (!newSelection.includes(option)) {
                                  newSelection.push(option);
                                }
                                setSelectedSection(newSelection);
                                // Use first selected for camera/view if needed
                                setSelectedView(newSelection[0]);
                                setSelectedCameraView(newSelection[0]);
                              } else {
                                // Uncheck: remove this option
                                const newSelection = selectedSection.filter(s => s !== option);
                                // If nothing left, default to Model
                                if (newSelection.length === 0) {
                                  setSelectedSection(["Model"]);
                                  setSelectedView("Model");
                                  setSelectedCameraView("Model");
                                } else {
                                  setSelectedSection(newSelection);
                                  setSelectedView(newSelection[0]);
                                  setSelectedCameraView(newSelection[0]);
                                }
                              }
                            }
                          }}
                        />
                      </div>
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {showOptimizationGraph ?
            <OptimizationGraph
              data={optimizationData}
              onClose={() => { setShowOptimizationGraph(false) }}
              optimizationDone={optimizationDone}
            /> : <div className={`
            model-container
            ${showInputDock || showOutputDock ? 'hidden md:block' : ''}
            ${showLogs
                ? (isLandscape ? 'hidden' : 'h-[70%] md:h-[60%]')
                : 'h-full md:h-full'
              }
            ${!showLogs ? 'full-height' : ''}
          `}>
              {loading || isRedesigning ? (
                <div className="modelLoading">
                  <p>{isRedesigning ? "Updating Model..." : "Loading Model..."}</p>
                </div>
              ) : renderBoolean ? (
                <div className="cadModel relative   bg-gradient-to-b from-[#FFFFFF] to-[#7E7E7E] dark:from-[#535353] dark:to-[#000000]">
                  {/* Existing background color picker - left side */}
                  {/* <div className="absolute top-2 left-2 flex items-center gap-2 bg-white/90 dark:bg-osdag-dark-color/90 px-3 py-1.5 rounded-lg shadow-md z-10">
                  <label htmlFor="bgColorPicker" className="text-xs font-medium text-black dark:text-white mr-1">
                    Background:
                  </label>
                  <input
                    type="color"
                    id="bgColorPicker"
                    value={bgColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="bg-color-picker"
                    title="Change Background Color"
                  />
                </div> */}

                  {/* Grid selector - right side - Hide when docks are open on mobile */}
                  {(!showInputDock && !showOutputDock) && (
                    <GridSelector onViewChange={handleOrthographicViewChange} />
                  )}

                  <Canvas
                    gl={{ antialias: true, preserveDrawingBuffer: true, alpha: true }}
                    style={{ width: "100%", height: "100%", background: 'transparent' }}
                  >
                    <PerspectiveCamera
                      ref={cameraRef}
                      makeDefault
                      position={cameraPos}
                      fov={13}
                      near={0.1}
                      far={1000}
                    />
                    <Suspense
                      fallback={
                        <Html>
                          <p>Loading 3D Model...</p>
                        </Html>
                      }
                    >
                      {renderBoolean && normalizedCadModelPaths && Object.keys(normalizedCadModelPaths).length > 0 && (() => {
                        const activeViews = Array.isArray(selectedSection) ? selectedSection : [selectedSection];
                        const primary = activeViews[0] || "Model";
                        if (primary && primary !== "Model") {
                          const hasPart =
                            normalizedCadModelPaths[primary] ||
                            normalizedCadModelPaths[primary?.toLowerCase?.()] ||
                            normalizedCadModelPaths[primary?.toUpperCase?.()];
                          if (!hasPart) {
                            return (
                              <Html>
                                <p>{`No CAD part found for view "${primary}". Available parts: ${Object.keys(normalizedCadModelPaths).join(", ")}`}</p>
                              </Html>
                            );
                          }
                        }
                        return null;
                      })()}
                      <Model
                        modelPaths={normalizedCadModelPaths}
                        selectedView={Array.isArray(selectedSection) ? selectedSection[0] : selectedSection}
                        selectedViews={selectedSection}
                        isMobile={window.innerWidth < 768}
                        cameraSettings={{
                          ...cameraSettings,
                          connectivity: getConnectivity(), // Add connectivity info
                        }}
                        hoverDict={hoverDict}
                        onHoverLabel={handleHoverLabel}
                        onHoverEnd={handleHoverEnd}
                        moduleCadConfig={moduleConfig?.cadConfig}
                        key={`${modelKey}-${selectedSection}`}
                      />
                      <ScreenshotCapture
                        screenshotTrigger={screenshotTrigger}
                        setScreenshotTrigger={setScreenshotTrigger}
                        selectedView={Array.isArray(selectedSection) ? selectedSection[0] : selectedSection}
                      />
                    </Suspense>
                  </Canvas>
                </div>
              ) : (
                <div className="modelback"></div>
              )}
            </div>}

          {showLogs && output && (window.innerWidth >= 768 || (!showInputDock && !showOutputDock)) && (
            <div className={`
              logs-container
              ${isLandscape ? 'h-full' : 'h-[20%] md:h-[20%]'}
              ${!showInputDock ? 'md:pl-0' : 'md:pl-[30px]'}
              ${!showOutputDock && output ? 'md:pr-0' : ''}
            `}>
              <Logs logs={logs} />
            </div>
          )}
        </div>
        )}

        {/* Right - Output Dock - Only show if showOutputDock is true and output exists */}
        {showOutputDock && output && outputConfig && (
          <div className={`
            flex
            fixed md:relative left-0 right-0 md:left-auto md:right-auto top-24 md:top-auto bottom-0 md:bottom-auto z-50 md:z-auto
            w-full md:w-[400px]
            flex-col
            bg-white dark:bg-osdag-dark-color
          `}>
            <BaseOutputDock
              output={output}
              outputConfig={outputConfig}
              title={title || UI_STRINGS.OUTPUT_DOCK}
              extraState={{ ...extraState, cadModelPaths, renderCadModel: renderBoolean }}
              handleCreateDesignReport={handleCreateDesignReport}
              saveOutput={saveOutput}
            />
          </div>
        )}
      </div>

      {/* Design Report Modal */}
      <DesignReportModal
        isOpen={createDesignReportBool}
        onCancel={handleCancelDesignReport}
        onOk={handleOkDesignReport}
        designReportInputs={designReportInputs}
        setDesignReportInputs={setDesignReportInputs}
        output={output}
        moduleId={moduleConfig?.designType}
        inputValues={inputs}
        logs={logs}
        moduleConfig={moduleConfig}
        boltDiameterList={boltDiameterList}
        propertyClassList={propertyClassList}
        thicknessList={thicknessList}
        angleList={angleList}
        allSelected={allSelected}
        extraState={extraState}
      />

      {/* Customization Modals */}
      {
        moduleConfig.modalConfig.map((modal) => (
          <CustomizationModal
            key={modal.key}
            isOpen={modalStates[modal.key]}
            onClose={() => updateModalState(modal.key, false)}
            title="Customized"
            dataSource={contextData[modal.dataSource] || (modalDynamicSrc[modal.inputKey] || [])} // FIXED: This now includes angleList
            selectedItems={selectedItems[modal.inputKey]}
            onTransferChange={(nextTargetKeys) =>
              updateSelectedItems(modal.inputKey, nextTargetKeys)
            }
          />
        ))
      }

      {/* Design Preferences Modal */}
      {
        designPrefModalStatus && (
          <Modal
            open={designPrefModalStatus}
            // onCancel={() => setConfirmationModal(true)}
            onCancel={() =>
              isInputLocked
                ? setDesignPrefModalStatus(false)   // Directly close
                : setConfirmationModal(true)        // Ask confirmation
            }
            footer={null}
            minWidth={window.innerWidth < 768 ? undefined : 1200}
            width={window.innerWidth < 768 ? '100%' : 1400}
            maxHeight={window.innerWidth < 768 ? '100%' : 1200}
            maskClosable={false}
            className="[&_.ant-modal-header]:bg-transparent [&_.ant-modal-close]:right-4"
          >
            <DesignPrefSections
              module={moduleConfig.sessionName}
              inputs={inputs}
              setInputs={setInputs}
              setDesignPrefModalStatus={setDesignPrefModalStatus}
              confirmationModal={confirmationModal}
              setConfirmationModal={setConfirmationModal}
              isInputLocked={isInputLocked}
            />
          </Modal>
        )
      }

      {/* Reset Confirmation Modal */}
      <Modal
        open={showResetConfirmation}
        title={
          <span>
            {confirmationType === "reset"
              ? "Confirm Reset"
              : "Unsaved Progress"}
          </span>
        }
        onCancel={() => {
          setShowResetConfirmation(false);
          setConfirmationType("reset");
        }}
        footer={[
          <Button key="cancel" onClick={() => setShowResetConfirmation(false)}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            style={{ background: "rgb(135, 91, 91)", color: "white" }}
            onClick={performResetEnhanced}
          >
            {confirmationType === "reset"
              ? "Yes, Reset Everything"
              : "Yes, Leave Page"}
          </Button>,
        ]}
        width={window.innerWidth < 768 ? '90%' : 500}
        className="[&_.ant-modal-header]:bg-transparent [&_.ant-modal-close]:right-4"
      >
        <div>
          <p>
            {confirmationType === "reset"
              ? "Are you sure you want to reset all inputs and clear the current design?"
              : "You have unsaved design progress. Are you sure you want to leave?"}
          </p>
          <br />
          <p>
            <strong>This will lose all your current work.</strong>
          </p>
        </div>
      </Modal>

      {/* Loading Modal */}
      <Modal
        open={isLoadingModalVisible}
        footer={null}
        closable={false}
        maskClosable={false}
        centered
        width={window.innerWidth < 768 ? '90%' : 420}
        className="loading-modal"
        styles={{
          body: {
            textAlign: "center",
            padding: "30px 20px",
          },
        }}
      >
        <div className="loading-content">
          <div>🔧 OSDAG Design Processing</div>
          <div>
            <div className="spinner"></div>
          </div>
          <div>{loadingStage || "Generating your engineering design..."}</div>
          <div>Please wait while we create your 3D model</div>
        </div>
      </Modal>

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>

      {/* Hover tooltip overlay */}
      {hoverText && (
        <div
          style={{
            position: 'fixed',
            left: hoverPos.x,
            top: hoverPos.y,
            background: 'rgba(0,0,0,0.85)',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: 6,
            pointerEvents: 'none',
            fontSize: 12,
            zIndex: 1000,
            maxWidth: '250px',
            lineHeight: '1.4',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
          dangerouslySetInnerHTML={{ __html: hoverText }}
        />
      )}
    </div >
  );
};
