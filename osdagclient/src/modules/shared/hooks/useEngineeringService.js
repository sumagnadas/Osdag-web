/**
 * useEngineeringService Hook
 * 
 * Centralized API service layer for all engineering module operations.
 * This hook contains NO state - only API call functions.
 * 
 * All API calls are extracted from:
 * - ModuleState.jsx (Context)
 * - moduleApi.js
 * - EngineeringModule.jsx
 * - DesignReportModal.jsx
 */

import { useCallback, useMemo } from 'react';
import { getAccessToken } from '../../../utils/auth';
import { MODULE_SLUGS } from '../../../constants/apiRoutes';
import { apiBase } from '../../../api';
import { exportToCSV as exportToCSVUtil } from '../../../utils/csvUtils';

/**
 * Get module slug from module key
 * @param {string} moduleKey - Module identifier
 * @returns {string} Module slug
 */
const getSlug = (moduleKey) => MODULE_SLUGS[moduleKey] || moduleKey;

// ===================================================================
// API CLIENT HELPER
// ===================================================================

/**
 * Create API client helper
 * @param {string} baseUrl - Base API URL
 * @returns {Function} API call function
 */
const createApiClient = (baseUrl) => {
  return async (url, options = {}) => {
    const token = getAccessToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const response = await fetch(`${baseUrl}${url}`, {
      ...options,
      headers,
      credentials: 'include',
      mode: 'cors',
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json().catch(() => ({}));
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        try {
          const text = await response.text();
          if (text) errorMessage = text;
        } catch {}
      }
      throw new Error(errorMessage);
    }

    return response;
  };
};

// ===================================================================
// MAIN HOOK
// ===================================================================

export const useEngineeringService = () => {
  const BASE_URL = apiBase;
  const apiCall = useMemo(() => createApiClient(BASE_URL), [BASE_URL]);

  // ===================================================================
  // 1. MODULE DATA - Get module options and data
  // ===================================================================

  /**
   * Get module data (options, lists, etc.)
   * @param {string} moduleKey - Module identifier
   * @param {Object} options - Optional parameters
   * @param {string} options.connectivity - Connection type filter
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const getModuleData = useCallback(async (moduleKey, options = {}) => {
    try {
      if (!moduleKey) {
        return { success: false, error: 'Module name is required' };
      }

      const slug = getSlug(moduleKey);
      const email = localStorage.getItem('email');
      
      let url = `api/modules/${slug}/options/`;
      const params = new URLSearchParams();
      if (options.connectivity) params.append('connectivity', options.connectivity);
      if (email) params.append('email', email);
      const qs = params.toString();
      if (qs) url += `?${qs}`;

      const response = await apiCall(url, { method: 'GET' });
      const data = await response.json();

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [apiCall]);

  // ===================================================================
  // 2. DESIGN - Design calculation
  // ===================================================================

  /**
   * Create design calculation
   * @param {string} moduleKey - Module identifier
   * @param {Object} inputs - Design input values
   * @returns {Promise<{status: number, body: Object}>}
   */
  const createDesign = useCallback(async (moduleKey, inputs) => {
    try {
      const slug = getSlug(moduleKey);
      const url = `api/modules/${slug}/design/`;
      
      const response = await apiCall(url, {
        method: 'POST',
        body: JSON.stringify({ inputs }),
      });

      const jsonResponse = await response.json();
      return { status: response.status, body: jsonResponse };
    } catch (error) {
      return { status: 500, body: { success: false, error: error.message } };
    }
  }, [apiCall]);

  // ===================================================================
  // 3. CAD - 3D Model generation and download
  // ===================================================================

  /**
   * Create 3D CAD model
   * @param {string} moduleKey - Module identifier
   * @param {Object} inputs - Design input values
   * @returns {Promise<{success: boolean, files?: Object, hover_dict?: Object, error?: string}>}
   */
  const createCADModel = useCallback(async (moduleKey, inputs) => {
    try {
      const slug = getSlug(moduleKey);
      const url = `api/modules/${slug}/cad/`;

      const response = await apiCall(url, {
        method: 'POST',
        body: JSON.stringify({ inputs }),
      });

      const data = await response.json();

      if (response.status === 201 && data.status === 'success') {
        return {
          success: true,
          files: data.files,
          hover_dict: data.hover_dict,
        };
      } else {
        throw new Error(data.message || 'CAD generation failed');
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [apiCall]);

  /**
   * Download CAD model in specified format
   * @param {string} format - File format (e.g., 'step', 'iges', 'stl')
   * @returns {Promise<{success: boolean, blob?: Blob, error?: string}>}
   */
  const downloadCADModel = useCallback(async (format) => {
    try {
      const response = await apiCall('api/design/downloadCad/', {
        method: 'POST',
        body: JSON.stringify({
          format: format,
          section: 'Model',
        }),
      });

      const blob = await response.blob();
      return { success: true, blob };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [apiCall]);

  /**
   * Design and generate CAD in one call
   * @param {string} moduleKey - Module identifier
   * @param {Object} inputs - Design input values
   * @returns {Promise<{design?: Object, cad?: Object, error?: string}>}
   */
  const designAndGenerateCad = useCallback(async (moduleKey, inputs) => {
    try {
      // First, run design calculation
      const designResult = await createDesign(moduleKey, inputs);
      
      if (designResult.status !== 201) {
        return { design: null, cad: null, error: designResult.body?.message || 'Design calculation failed' };
      }

      const designData = designResult.body;
      const hasData = designData?.data && Object.keys(designData.data || {}).length > 0;
      const isSuccess = designResult.status === 201 && designData?.success !== false && (hasData || Array.isArray(designData));

      if (!isSuccess) {
        return { design: null, cad: null, error: designData?.message || 'Design calculation failed' };
      }

      // Then, generate CAD
      const cadResult = await createCADModel(moduleKey, inputs);
      
      if (!cadResult.success) {
        return { design: designData, cad: null, error: cadResult.error };
      }

      return { design: designData, cad: cadResult, error: null };
    } catch (error) {
      return { design: null, cad: null, error: error.message };
    }
  }, [createDesign, createCADModel]);

  // ===================================================================
  // 4. PROJECTS - Project management
  // ===================================================================

  /**
   * Get project by ID
   * @param {number} projectId - Project ID
   * @returns {Promise<{success: boolean, project?: Object, error?: string}>}
   */
  const getProject = useCallback(async (projectId) => {
    try {
      const response = await apiCall(`api/projects/${projectId}/`, {
        method: 'GET',
      });

      const data = await response.json();
      if (data.success && data.project) {
        return { success: true, project: data.project };
      } else {
        return { success: false, error: data.error || 'Project not found' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [apiCall]);

  /**
   * Update project
   * @param {number} projectId - Project ID
   * @param {Object} data - Project data to update
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const updateProject = useCallback(async (projectId, data) => {
    try {
      const response = await apiCall(`api/projects/${projectId}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Failed to update project' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [apiCall]);

  // ===================================================================
  // 5. OSI FILES - OSI file generation
  // ===================================================================

  /**
   * Save OSI file from inputs
   * @param {string} name - Project name
   * @param {string} moduleId - Module identifier
   * @param {Object} inputs - Input values
   * @param {boolean} inline - Whether to return inline (for download)
   * @returns {Promise<{success: boolean, content_base64?: string, filename?: string, error?: string}>}
   */
  const saveOSIFromInputs = useCallback(async (name, moduleId, inputs, inline = false) => {
    try {
      const response = await apiCall('save-osi-from-inputs/', {
        method: 'POST',
        body: JSON.stringify({
          name,
          module_id: moduleId,
          inputs,
          inline,
        }),
      });

      const data = await response.json();
      if (data.success) {
        return {
          success: true,
          content_base64: data.content_base64,
          filename: data.filename,
          is_guest: data.is_guest,
        };
      } else {
        return { success: false, error: data.error || 'Failed to save OSI file' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [apiCall]);

  // ===================================================================
  // 6. REPORTS - Report generation
  // ===================================================================

  /**
   * Generate initial report
   * @param {Object} reportData - Report data including metadata, module_id, input_values, etc.
   * @returns {Promise<{success: boolean, report_id?: string, sections?: Object, error?: string}>}
   */
  const generateInitialReport = useCallback(async (reportData) => {
    try {
      const response = await apiCall('api/report/generate-initial/', {
        method: 'POST',
        body: JSON.stringify(reportData),
      });

      const result = await response.json();
      if (result.success) {
        return {
          success: true,
          report_id: result.report_id,
          sections: result.sections,
        };
      } else {
        return { success: false, error: result.error || 'Failed to generate report' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [apiCall]);

  /**
   * Customize report (generate PDF)
   * @param {string} reportId - Report ID
   * @param {Array<string>} selectedSections - Selected sections
   * @returns {Promise<{success: boolean, blob?: Blob, error?: string}>}
   */
  const customizeReport = useCallback(async (reportId, selectedSections) => {
    try {
      const response = await apiCall('api/report/customize/', {
        method: 'POST',
        body: JSON.stringify({
          report_id: reportId,
          selected_sections: selectedSections,
        }),
      });

      const blob = await response.blob();
      return { success: true, blob };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [apiCall]);

  // ===================================================================
  // 7. MATERIALS & PREFERENCES - Custom materials and design preferences
  // ===================================================================

  /**
   * Add custom material
   * @param {Object} materialData - Material data
   * @param {string} materialData.grade - Material grade
   * @param {Object} materialData.inputs - Material properties (fy_20, fy_20_40, fy_40, fu)
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const addCustomMaterial = useCallback(async (materialData) => {
    try {
      const { grade, inputs } = materialData;
      const email = localStorage.getItem('email');

      const response = await apiCall('api/materialDetails/', {
        method: 'POST',
        body: JSON.stringify({
          email,
          materialName: grade,
          fy_20: parseInt(inputs.fy_20),
          fy_20_40: parseInt(inputs.fy_20_40),
          fy_40: parseInt(inputs.fy_40),
          fu: parseInt(inputs.fu),
        }),
      });

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [apiCall]);

  /**
   * Get design preferences
   * @param {Object} params - Query parameters
   * @param {string} params.supported_section - Supported section
   * @param {string} params.supporting_section - Supporting section
   * @param {string} params.connectivity - Connectivity type
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const getDesignPreferences = useCallback(async (params = {}) => {
    try {
      let url = 'api/design-preferences/?';
      const { supported_section, supporting_section, connectivity } = params;

      if (supported_section) url += `supported_section=${encodeURIComponent(supported_section)}&`;
      if (supporting_section) url += `supporting_section=${encodeURIComponent(supporting_section)}&`;
      if (connectivity) url += `connectivity=${encodeURIComponent(connectivity)}`;

      const response = await apiCall(url, { method: 'GET' });
      const data = await response.json();

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [apiCall]);

  /**
   * Upload company logo
   * @param {File} file - Logo file
   * @param {string} filename - Logo filename
   * @returns {Promise<{success: boolean, logoPath?: string, error?: string}>}
   */
  const uploadCompanyLogo = useCallback(async (file, filename) => {
    try {
      const formData = new FormData();
      formData.append('file', file, filename);

      const response = await apiCall('api/company-logo/', {
        method: 'POST',
        body: formData,
      });

      if (response.status === 201) {
        const result = await response.json();
        return { success: true, logoPath: result.logoFullPath };
      } else {
        throw new Error(`Logo upload failed: ${response.status}`);
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [apiCall]);

  // ===================================================================
  // 8. WEBSOCKET - Websocket Connection for real-time updates
  // ===================================================================

  const getRTUpdates = useCallback((ws_url, onOpen = () => { }, onMessage = () => { }, onError = () => { }, onClose = () => { }) => {
    const backend_url = new URL(BASE_URL);
    try {
      const socket = new WebSocket("ws://" + backend_url.host + "/" + ws_url);
      socket.onopen = onOpen;
      socket.onmessage = onMessage;
      socket.onerror =  onError;
      socket.onclose = onClose;
    }
    catch (error) {
      console.log(error);
    }
  }, [])

  // ===================================================================
  // RETURN API
  // ===================================================================

  return {
    // Module Data
    getModuleData,

    // Design
    createDesign,
    designAndGenerateCad,

    // CAD
    createCADModel,
    downloadCADModel,

    // Projects
    getProject,
    updateProject,

    // OSI Files
    saveOSIFromInputs,

    // Reports
    generateInitialReport,
    customizeReport,

    // Materials & Preferences
    addCustomMaterial,
    getDesignPreferences,
    uploadCompanyLogo,

    // WebSocket
    getRTUpdates: getRTUpdates,

    // CSV
    exportToCSV: exportToCSVUtil,

    // Utilities
    getSlug, // Expose slug helper for external use
  };
};

