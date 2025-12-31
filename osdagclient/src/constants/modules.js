import {
    MODULE_KEY_FIN_PLATE,
    MODULE_KEY_CLEAT_ANGLE,
    MODULE_KEY_END_PLATE,
    MODULE_KEY_SEAT_ANGLE,
    MODULE_KEY_COVER_PLATE_BOLTED,
    MODULE_KEY_COVER_PLATE_WELDED,
    MODULE_KEY_BEAM_BEAM_END_PLATE,
    MODULE_KEY_BEAM_BEAM_END_PLATE_ALT,
    MODULE_KEY_BEAM_COLUMN_END_PLATE,
    MODULE_KEY_BEAM_COLUMN_END_PLATE_ALT,
    MODULE_KEY_CC_COVER_PLATE_BOLTED,
    MODULE_KEY_CC_COVER_PLATE_WELDED,
    MODULE_KEY_CC_END_PLATE,
    MODULE_KEY_BUTT_JOINT_WELDED,
    MODULE_KEY_BUTT_JOINT_BOLTED,
    MODULE_KEY_LAP_JOINT_WELDED,
    MODULE_KEY_LAP_JOINT_BOLTED,
    MODULE_KEY_SIMPLY_SUPPORTED_BEAM,
    MODULE_KEY_PLATE_GIRDER,
    MODULE_KEY_BOLTED_TO_END_GUSSET,
    MODULE_KEY_WELDED_TO_END_GUSSET,
    MODULE_KEY_TENSION_BOLTED,
    MODULE_KEY_TENSION_WELDED,
} from "./DesignKeys";

export const MODULE_SUBMODULES = {
    Connections: [
        { key: "Simple", "label": "Simple Connections" },
        { key: "Shear", label: "Shear Connection" },
        { key: "Moment", label: "Moment Connection" },
        { key: "BasePlate", label: "Base Plate" },
        { key: "Truss", label: "Truss Connection" },
    ],
    TensionMember: [{ key: "Tension", label: "Tension Member" }],
    CompressionMember: [{ key: "Compression", label: "Compression Member" }],
    FlexureMember: [{ key: "Flexure", label: "Flexure Member" }],
};

export const CONNECTIONS_TAB_CONTENT = {
    Simple: [
        {
            label: "Simple Connections",
            options: [
                { key: MODULE_KEY_BUTT_JOINT_WELDED, label: "Butt Joint Welded", img: "shear_fin_plate_connec.svg" },
                { key: MODULE_KEY_BUTT_JOINT_BOLTED, label: "Butt Joint Bolted", img: "shear_fin_plate_connec.svg" },
                { key: MODULE_KEY_LAP_JOINT_WELDED, label: "Lap Joint Welded", img: "shear_fin_plate_connec.svg" },
                { key: MODULE_KEY_LAP_JOINT_BOLTED, label: "Lap Joint Bolted", img: "shear_fin_plate_connec.svg" },
            ],
        },
    ],
    Shear: [
        {
            label: "Shear Connections",
            options: [
                { key: MODULE_KEY_FIN_PLATE, label: "Fin Plate", img: "shear_fin_plate_connec.svg" },
                { key: MODULE_KEY_CLEAT_ANGLE, label: "Cleat Angle", img: "shear_fin_plate_connec.svg" },
                { key: MODULE_KEY_END_PLATE, label: "End Plate", img: "shear_fin_plate_connec.svg" },
                { key: MODULE_KEY_SEAT_ANGLE, label: "Seated Angle", img: "shear_fin_plate_connec.svg" },
            ],
        },
    ],
    Moment: [
        {
            label: "Beam to Beam Splice",
            options: [
                { key: MODULE_KEY_COVER_PLATE_BOLTED, label: "Cover Plate Bolted", img: "shear_fin_plate_connec.svg" },
                { key: MODULE_KEY_COVER_PLATE_WELDED, label: "Cover Plate Welded", img: "shear_fin_plate_connec.svg" },
                { key: MODULE_KEY_BEAM_BEAM_END_PLATE, label: "End Plate", img: "shear_fin_plate_connec.svg" }, 
            ],
        },
        {
            label: "Beam to Column Splice",
            options: [
                { key: MODULE_KEY_BEAM_COLUMN_END_PLATE, label: "End Plate", img: "shear_fin_plate_connec.svg" },
            ],
        },
        {
            label: "Column to Column Splice",
            options: [
                { key: MODULE_KEY_CC_COVER_PLATE_BOLTED, label: "Cover Plate Bolted", img: "shear_fin_plate_connec.svg" },
                { key: MODULE_KEY_CC_COVER_PLATE_WELDED, label: "Cover Plate Welded", img: "shear_fin_plate_connec.svg" },
                { key: MODULE_KEY_CC_END_PLATE, label: "End Plate", img: "shear_fin_plate_connec.svg" },
            ],
        },
    ],
    BasePlate: [
        {
            label: "Base Plates",
            options: [{ key: "BasePlateConnection", label: "Base Plate Connection", img: "shear_fin_plate_connec.svg" }],
        },
    ],
    Truss: [{ label: "Truss Connections", options: [] }],
};

export const GENERIC_SUBMODULE_CONTENT = {
    Tension: [
        {
            label: "Tension Member",
            options: [
                { key: MODULE_KEY_BOLTED_TO_END_GUSSET, label: "Bolted to End Plate", img: "shear_fin_plate_connec.svg" },
                { key: MODULE_KEY_WELDED_TO_END_GUSSET, label: "Welded to End Plate", img: "shear_fin_plate_connec.svg" },
            ],
        },
    ],
    Compression: [
        {
            label: "Compression Member",
            options: [{ key: "StrutsInTrusses", label: "Struts in Trusses", img: "shear_fin_plate_connec.svg" }],
        },
    ],
    Flexure: [
        {
            label: "Flexure Member",
            options: [
                { key: MODULE_KEY_SIMPLY_SUPPORTED_BEAM, label: "Simply Supported Beam", img: "shear_fin_plate_connec.svg" },
                { key: "OnCantilever", label: "Cantilever Beam", img: "shear_fin_plate_connec.svg" },
                { key: "Purlin", label: "Purlin", img: "shear_fin_plate_connec.svg" },
                { key: MODULE_KEY_PLATE_GIRDER, label: "Plate Girder", img: "shear_fin_plate_connec.svg" },
            ],
        },
    ],
};

export const MODULE_ROUTES = {
    [MODULE_KEY_FIN_PLATE]: "/design/connections/shear/fin_plate",
    [MODULE_KEY_CLEAT_ANGLE]: "/design/connections/shear/cleat_angle",
    [MODULE_KEY_END_PLATE]: "/design/connections/shear/end_plate",
    [MODULE_KEY_SEAT_ANGLE]: "/design/connections/shear/seatAngle",
    [MODULE_KEY_CC_COVER_PLATE_BOLTED]: "/design/connections/column-to-column-splice/cover_plate_bolted",
    [MODULE_KEY_CC_COVER_PLATE_WELDED]: "/design/connections/column-to-column-splice/cover_plate_welded",
    [MODULE_KEY_CC_END_PLATE]: "/design/connections/column-to-column-splice/end_plate",
    [MODULE_KEY_COVER_PLATE_BOLTED]: "/design/connections/beam-to-beam-splice/cover_plate_bolted",
    [MODULE_KEY_COVER_PLATE_WELDED]: "/design/connections/beam-to-beam-splice/cover_plate_welded",
    [MODULE_KEY_BEAM_BEAM_END_PLATE]: "/design/connections/beam-to-beam-splice/end_plate",
    [MODULE_KEY_BEAM_COLUMN_END_PLATE]: "/design/connections/column-beam/end_plate",
    [MODULE_KEY_BUTT_JOINT_WELDED]: "/design/connections/simple/butt_joint_welded",
    [MODULE_KEY_BUTT_JOINT_BOLTED]: "/design/connections/simple/butt_joint_bolted",
    [MODULE_KEY_LAP_JOINT_WELDED]: "/design/connections/simple/lap_joint_welded",
    [MODULE_KEY_LAP_JOINT_BOLTED]: "/design/connections/simple/lap_joint_bolted",
    BasePlateConnection: "/design/connections/base_plate",
    [MODULE_KEY_SIMPLY_SUPPORTED_BEAM]: "/design/flexure_member/simply_supported_beam",
    [MODULE_KEY_PLATE_GIRDER]: "/design/flexure/plate_girder",
    OnCantilever: "/design/flexure/on_cantilever",
    Purlin: "/design/flexure/purlin",
    [MODULE_KEY_TENSION_BOLTED]: "/design/tension-member/bolted_to_end_gusset",
    [MODULE_KEY_TENSION_WELDED]: "/design/tension-member/welded_to_end_gusset",
    [MODULE_KEY_BOLTED_TO_END_GUSSET]: "/design/tension-member/bolted_to_end_gusset",
    [MODULE_KEY_WELDED_TO_END_GUSSET]: "/design/tension-member/welded_to_end_gusset",
    [MODULE_KEY_BEAM_COLUMN_END_PLATE_ALT]: "/design/connections/column-beam/end_plate",
    StrutsInTrusses: "/design/compression_member/compression_member/struts_in_trusses",
    // Add other needed routes
};

// Mapping from .osi Module names (desktop) → web module keys used above
// Extend as more modules are supported
export const MODULE_NAME_TO_KEY = {
    "Shear Connection - Fin Plate": MODULE_KEY_FIN_PLATE,
    "Shear Connection - End Plate": MODULE_KEY_END_PLATE,
    "Shear Connection - Cleat Angle": MODULE_KEY_CLEAT_ANGLE,
    "Shear Connection - Seated Angle": MODULE_KEY_SEAT_ANGLE,
    // Tension Members
    "Tension Member Bolted Design": MODULE_KEY_BOLTED_TO_END_GUSSET,
    // Moment Connection
    "Beam-to-Column End Plate Connection": MODULE_KEY_BEAM_COLUMN_END_PLATE_ALT,
    "Beam-to-Beam-Cover-Plate-Bolted-Connection": MODULE_KEY_COVER_PLATE_BOLTED,
    "Beam-to-Beam-Cover-Plate-Welded-Connection": MODULE_KEY_COVER_PLATE_WELDED,
    "Beam-Beam-End-Plate-Connection": MODULE_KEY_BEAM_BEAM_END_PLATE_ALT,
    "Column-to-Column-Cover-Plate-Welded-Connection" : MODULE_KEY_CC_COVER_PLATE_WELDED,
    "Column-to-Column-Cover-Plate-Bolted-Connection" : MODULE_KEY_CC_COVER_PLATE_BOLTED,
    "Column-to-Column-End-Plate-Connection" : MODULE_KEY_CC_END_PLATE,
    "Base-Plate": "BasePlateConnection",
};