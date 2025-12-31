// Output configuration for Plate Girder
// Based on documentation/plate-girder.md outputs section

export const plateGirderOutputConfig = {
  sections: {
    "Section Details": [
      { key: "Optimum.Designation", label: "Optimum Designation" },
      { key: "Optimum.UR_Compression", label: "Utilization Ratio" },
      { key: "Optimum.SC", label: "Section Classification" },
      { key: "betab_constatnt", label: "Beta_b Constant" },
      { key: "Eff.Sec.Area", label: "Effective Section Area (mm²)" },
    ],
    "Dimensions": [
      { key: "Web.Thickness", label: "Web Thickness (mm)" },
      { key: "TopFlange.Thickness", label: "Top Flange Thickness (mm)" },
      { key: "BottomFlange.Thickness", label: "Bottom Flange Thickness (mm)" },
      { key: "Total.Depth", label: "Total Depth (mm)" },
      { key: "Topflange.Width", label: "Top Flange Width (mm)" },
      { key: "Bottomflange.Width", label: "Bottom Flange Width (mm)" },
    ],
    "Stiffeners": [
      { key: "IntermediateStiffener.Thickness", label: "Intermediate Stiffener Thickness (mm)" },
      { key: "IntermediateStiffener.Spacing", label: "Intermediate Stiffener Spacing (mm)" },
      { key: "LongitudnalStiffener.Thickness", label: "Longitudinal Stiffener Thickness (mm)" },
      { key: "LongitudnalStiffener.Numbers", label: "Longitudinal Stiffener Numbers" },
      { key: "EndpanelStiffener.Thickness", label: "End Panel Stiffener Thickness (mm)" },
    ],
    "Design Results": [
      { key: "Moment.Strength", label: "Design Bending Strength (kNm)" },
      { key: "Shear.Strength", label: "Design Shear Strength (kN)" },
      { key: "Buckling.Strength", label: "Web Buckling Strength (kN)" },
      { key: "Crippling.Strength", label: "Web Crippling Strength (kN)" },
    ],
    "Welds": [
      { key: "WeldWebtoflange.Data", label: "Weld for Web to Flange (mm)" },
      { key: "WeldStiffenertoweb.Data", label: "Weld for Stiffener to Web (mm)" },
    ],
    "Lateral Torsional Buckling": [
      { key: "T.Constant", label: "T Constant (mm⁴)" },
      { key: "W.Constant", label: "W Constant (mm⁶)" },
      { key: "Elastic.Moment", label: "Elastic Critical Moment (kNm)" },
      { key: "L.T.B.Details", label: "LTB Details" },
    ],
    "Longitudinal Stiffeners": [
      { key: "LongitudinalStiffener1.pos", label: "Longitudinal Stiffener 1 Position (mm)" },
      { key: "LongitudinalStiffener2.pos", label: "Longitudinal Stiffener 2 Position (mm)" },
    ],
    "Deflection": [
      { key: "Max.Deflection", label: "Calculated Deflection (mm)" },
      { key: "DeflectionLimit", label: "Deflection Limit (mm)" },
      { key: "Deflection.Ratio", label: "Deflection Ratio" },
    ],
    "Design Status": [
      { key: "Design.Status", label: "Design Status" }
    ]
  },

  modals: {
    LTBModal: { type: "ltb", buttonText: "LTB Details" },
    WebBucklingModal: { type: "webbuckling", buttonText: "Web Buckling Details" },
    StiffenerModal: { type: "stiffener", buttonText: "Stiffener Details" },
  },

  modalTypes: {
    ltb: {
      title: "Lateral Torsional Buckling Details",
      width: "70%",
      layout: "two-column",
      hasImage: true,
      note: "Lateral torsional buckling analysis details"
    },
    webbuckling: {
      title: "Web Buckling Analysis",
      width: "70%",
      layout: "two-column",
      hasImage: false,
      note: "Web buckling and crippling analysis details"
    },
    stiffener: {
      title: "Stiffener Details",
      width: "70%",
      layout: "two-column",
      hasImage: false,
      note: "Stiffener design and spacing details"
    }
  },

  modalData: {
    ltb: {
      LTBModal: [
        { key: "Elastic.Moment", label: "Elastic Critical Moment (kNm)" },
        { key: "T.Constant", label: "Torsional Constant (mm⁴)" },
        { key: "W.Constant", label: "Warping Constant (mm⁶)" },
        { key: "Imperfection.LTB", label: "Imperfection Factor" },
        { key: "SR.LTB", label: "Slenderness Ratio" },
      ]
    },
    webbuckling: {
      WebBucklingModal: [
        { key: "Buckling.Strength", label: "Web Buckling Strength (kN)" },
        { key: "Crippling.Strength", label: "Web Crippling Strength (kN)" },
      ]
    },
    stiffener: {
      StiffenerModal: [
        { key: "IntermediateStiffener.Thickness", label: "Intermediate Stiffener Thickness (mm)" },
        { key: "IntermediateStiffener.Spacing", label: "Intermediate Stiffener Spacing (mm)" },
        { key: "LongitudnalStiffener.Thickness", label: "Longitudinal Stiffener Thickness (mm)" },
        { key: "LongitudnalStiffener.Numbers", label: "Number of Longitudinal Stiffeners" },
      ]
    }
  }
};

