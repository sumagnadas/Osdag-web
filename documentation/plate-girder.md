# Plate Girder Module - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Design Types](#design-types)
3. [Inputs](#inputs)
   - [Phase 1: Normal/Manual Inputs](#phase-1-normalmanual-inputs)
   - [Phase 2: Optimized Inputs](#phase-2-optimized-inputs)
4. [Outputs](#outputs)
5. [Module Architecture](#module-architecture)
6. [Optimization System](#optimization-system)
7. [Real-Time Visualization](#real-time-visualization)
8. [Design Checks](#design-checks)
9. [File Structure](#file-structure)
10. [Workflow Diagrams](#workflow-diagrams)
11. [Key Algorithms](#key-algorithms)
12. [Configuration](#configuration)

---

## Overview

The Plate Girder module in Osdag is a comprehensive design and optimization system for welded plate girders according to IS 800:2007. It features:

- **Two Design Types**: Manual/Customized design and Optimized design using Particle Swarm Optimization (PSO)
- **Real-Time Visualization**: Live 3D dashboard showing optimization progress (for optimized design)
- **Comprehensive Design Checks**: Moment, shear, buckling, crippling, deflection, and weld checks
- **Symmetric and Unsymmetric Sections**: Supports both symmetric and unsymmetric flange configurations
- **Thick and Thin Web Designs**: Handles both thick web (without intermediate stiffeners) and thin web (with intermediate stiffeners) designs

---

## Design Types

The Plate Girder module supports two main design approaches:

### 1. Manual/Customized Design (`Customized`)

**Description**: User manually specifies all geometric dimensions of the plate girder.

**When to Use**:
- When specific dimensions are required
- When optimizing for non-weight objectives
- When dimensions are constrained by fabrication or architectural requirements

**Input Requirements**:
- Total depth (D) - **Required**
- Top flange width - **Required**
- Bottom flange width - **Required**
- Web thickness - **Required**
- Top flange thickness - **Required**
- Bottom flange thickness - **Required**
- All other design preference parameters

**Process**:
1. User enters all geometric dimensions in Input Dock
2. System performs design checks
3. Results displayed with utilization ratios
4. User can iterate by adjusting dimensions manually

### 2. Optimized Design (`Optimized`)

**Description**: System automatically finds optimal dimensions using Particle Swarm Optimization (PSO) to minimize weight while satisfying all design constraints.

**When to Use**:
- When weight optimization is the primary goal
- When exploring design space for best solution
- When multiple constraints need to be balanced

**Input Requirements**:
- Material selection - **Required**
- Loading conditions (Moment, Shear) - **Required**
- Optimization bounds (can be customized or use defaults)
- Design preference parameters

**Process**:
1. User selects "Optimized" as design type
2. System uses PSO to search for optimal dimensions
3. Real-time visualization shows optimization progress
4. Best solution automatically selected and displayed

**Key Features**:
- Intelligent PSO with discrete variable handling
- Real-time 3-panel visualization dashboard
- Automatic constraint satisfaction
- Weight minimization objective

---

## Inputs

### Phase 1: Normal/Manual Inputs

These inputs are required for **both** Manual and Optimized design types.

#### Input Dock Parameters

**Location**: Main Input Dock (visible in main window)

| Parameter | Key | Type | Required | Description | Units |
|-----------|-----|------|----------|-------------|-------|
| **Module** | `KEY_MODULE` | Text | Yes | Module identifier | - |
| **Material** | `KEY_MATERIAL` | ComboBox | Yes | Steel material grade (e.g., E250, E350) | - |
| **Design Type** | `KEY_OVERALL_DEPTH_PG_TYPE` | ComboBox | Yes | "Customized" or "Optimized" | - |
| **Total Depth** | `KEY_OVERALL_DEPTH_PG` | TextBox | Conditional* | Total depth of girder | mm |
| **Web Thickness** | `KEY_WEB_THICKNESS_PG` | ComboBox | Yes | Web plate thickness (standard values) | mm |
| **Top Flange Width** | `KEY_TOP_Bflange_PG` | TextBox | Conditional* | Width of top flange | mm |
| **Top Flange Thickness** | `KEY_TOP_FLANGE_THICKNESS_PG` | ComboBox | Yes | Top flange thickness (standard values) | mm |
| **Bottom Flange Width** | `KEY_BOTTOM_Bflange_PG` | TextBox | Conditional* | Width of bottom flange | mm |
| **Bottom Flange Thickness** | `KEY_BOTTOM_FLANGE_THICKNESS_PG` | ComboBox | Yes | Bottom flange thickness (standard values) | mm |
| **Length** | `KEY_LENGTH` | TextBox | Yes | Span length of girder | m |
| **Support Type** | `KEY_DESIGN_TYPE_FLEXURE` | ComboBox | Yes | "Major Laterally Supported" or "Major Laterally Unsupported" | - |
| **Support Width** | `KEY_SUPPORT_WIDTH` | TextBox | Yes | Width of support | mm |
| **Web Philosophy** | `KEY_WEB_PHILOSOPHY` | ComboBox | Yes | "Thick Web without ITS" or "Thin Web with ITS" | - |
| **Torsional Restraint** | `KEY_TORSIONAL_RES` | ComboBox | Yes | Torsional restraint condition | - |
| **Warping Restraint** | `KEY_WARPING_RES` | ComboBox | Yes | Warping restraint condition | - |
| **Moment** | `KEY_MOMENT` | TextBox | Yes | Factored bending moment | kNm |
| **Shear** | `KEY_SHEAR` | TextBox | Yes | Factored shear force | kN |
| **Bending Moment Shape** | `KEY_BENDING_MOMENT_SHAPE` | ComboBox | Yes | Loading pattern (UDL/Point load, Pin-Pin/Fix-Fix) | - |

*Conditional: Required only for "Customized" design type. Not required for "Optimized" design type.

**Standard Thickness Values** (`VALUES_PLATETHK`):
- Available options: 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40 mm
- Can be customized in Design Preferences

**Support Type Options** (`VALUES_SUPP_TYPE_temp`):
- "Major Laterally Supported"
- "Major Laterally Unsupported"

**Web Philosophy Options** (`WEB_PHILOSOPHY_list`):
- "Thick Web without ITS" (Intermediate Transverse Stiffeners)
- "Thin Web with ITS"

**Bending Moment Shape Options** (`Bending_moment_shape_list`):
- "Uniform Loading with pinned-pinned support" (`KEY_DISP_UDL_PIN_PIN_PG`)
- "Uniform Loading with fixed-fixed support" (`KEY_DISP_UDL_FIX_FIX_PG`)
- "Concentrate Load with pinned-pinned support" (`KEY_DISP_PL_PIN_PIN_PG`)
- "Concentrate load with fixed-fixed support" (`KEY_DISP_PL_FIX_FIX_PG`)

#### Design Preferences Parameters

**Location**: Design Preferences Dialog (accessible via Design Preferences button)

##### Tab 1: Girder Properties (`KEY_DISP_GIRDERSEC`)

| Parameter | Key | Type | Default | Description |
|-----------|-----|------|---------|-------------|
| **Material** | `KEY_SEC_MATERIAL` | ComboBox | From Input Dock | Material grade (auto-synced from Input Dock) |
| **Ultimate Strength (fu)** | `KEY_SEC_FU` | TextBox | Auto-calculated | Ultimate tensile strength | MPa |
| **Yield Strength (fy)** | `KEY_SEC_FY` | TextBox | Auto-calculated | Yield strength | MPa |

##### Tab 2: Optimisation

| Parameter | Key | Type | Default | Description |
|-----------|-----|------|---------|-------------|
| **Effective Area Parameter** | `KEY_EFFECTIVE_AREA_PARA` | TextBox | 1.0 | Effective area factor for compression |
| **Length Overwrite** | `KEY_LENGTH_OVERWRITE` | TextBox | 'NA' | Override length for specific checks | m |
| **Allow Class** | `KEY_ALLOW_CLASS` | ComboBox | 'Yes' | Allow Semi-Compact/Slender sections | Yes/No |
| **Load** | `KEY_LOAD` | ComboBox | 'Normal' | Loading condition type | Normal/Crane Load(Manual)/etc. |

**Load Options** (`KEY_DISP_LOAD_list`):
- 'Normal'
- 'Crane Load(Manual operation)'
- 'Crane load(Electric operation up to 50t)'
- 'Crane load(Electric operation over 50t)'

##### Tab 3: Stiffeners

| Parameter | Key | Type | Default | Description |
|-----------|-----|------|---------|-------------|
| **Intermediate Stiffener** | `KEY_IntermediateStiffener` | ComboBox | 'No' | Use intermediate transverse stiffeners | Yes/No |
| **Intermediate Stiffener Spacing** | `KEY_IntermediateStiffener_spacing` | TextBox | 'NA' | Spacing between intermediate stiffeners | mm |
| **Intermediate Stiffener Thickness** | `KEY_IntermediateStiffener_thickness` | ComboBox | 'All' | Thickness selection mode | All/Customized |
| **Intermediate Stiffener Thickness Values** | `KEY_IntermediateStiffener_thickness_val` | ComboBox | All standard | Selected thickness values | mm |
| **Longitudinal Stiffener** | `KEY_LongitudnalStiffener` | ComboBox | 'Yes and 1 stiffener' | Longitudinal stiffener configuration | No/Yes and 1/Yes and 2 |
| **Longitudinal Stiffener Thickness** | `KEY_LongitudnalStiffener_thickness` | ComboBox | 'All' | Thickness selection mode | All/Customized |
| **Longitudinal Stiffener Thickness Values** | `KEY_LongitudnalStiffener_thickness_val` | ComboBox | All standard | Selected thickness values | mm |
| **Shear Buckling Option** | `KEY_ShearBucklingOption` | ComboBox | First option | Shear buckling analysis method | Simple Post Critical/Tension Field |

**Standard Stiffener Thickness Values** (`VALUES_STIFFENER_THICKNESS`):
- 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40 mm

##### Tab 4: Additional Girder Data

| Parameter | Key | Type | Default | Description |
|-----------|-----|------|---------|-------------|
| **Symmetry** | `KEY_IS_IT_SYMMETRIC` | ComboBox | 'Symmetrical' | Section symmetry type | Symmetrical/Unsymmetrical |

**Symmetry Options** (`KEY_DISP_SYMMETRIC_list`):
- 'Symmetrical' (`KEY_DISP_SYM`): Top and bottom flanges are identical
- 'Unsymmetrical' (`KEY_DISP_UNSYM`): Top and bottom flanges can differ

##### Tab 5: Design

| Parameter | Key | Type | Default | Description |
|-----------|-----|------|---------|-------------|
| **Design Method** | `KEY_DP_DESIGN_METHOD` | ComboBox | 'Limit State Design' | Design methodology | Limit State Design |

##### Tab 6: Deflection

| Parameter | Key | Type | Default | Description |
|-----------|-----|------|---------|-------------|
| **Structure Type** | `KEY_STR_TYPE` | ComboBox | 'Highway Bridge' | Type of structure | Highway Bridge/Industrial/etc. |
| **Design Load** | `KEY_DESIGN_LOAD` | ComboBox | 'Live Load' | Load type for deflection | Live Load/Dead Load/etc. |
| **Member Options** | `KEY_MEMBER_OPTIONS` | ComboBox | 'Simple Span' | Member configuration | Simple Span/Cantilever/etc. |
| **Supporting Options** | `KEY_SUPPORTING_OPTIONS` | ComboBox | 'NA' | Supporting element type | Varies by structure type |
| **Maximum Deflection** | `KEY_MAX_DEFL` | TextBox/ComboBox | 600 | Deflection limit | mm or Span/ratio |

**Structure Type Options** (`KEY_STR_TYPE`):
- 'Highway Bridge'
- 'Industrial Building'
- 'Other'

**Design Load Options** (`VALUE_DESIGN_LOAD_list`):
- 'Live load'
- 'Dead load'
- 'Crane Load(Manual operation)'
- 'Crane load(Electric operation up to 50t)'
- 'Crane load(Electric operation over 50t)'

**Member Options** (`VALUES_MEMBER_OPTIONS`):
- Varies by structure type
- Examples: 'Simple Span', 'Cantilever Span', 'Purlin and Girts', etc.

**Maximum Deflection Options** (`VALUES_MAX_DEFL`):
- 'Span/600', 'Span/800', 'Span/400', 'Span/300', 'Span/360', 'Span/150', 'Span/180', 'Span/240', 'Span/120', 'Span/500', 'Span/750', 'Span/1000'
- Or custom value in mm

### Phase 2: Optimized Inputs

These inputs are **only required/applicable** when Design Type is set to "Optimized".

#### Optimization Bounds

**Location**: Design Preferences → Optimisation Tab → Customize buttons

When "Optimized" design type is selected, users can customize the search space bounds for optimization variables. If not customized, default bounds are used.

##### Default Bounds

| Variable | Symbol | Lower Bound | Upper Bound | Step Size | Discrete Values |
|----------|--------|-------------|-------------|-----------|-----------------|
| **Total Depth** | `D` | 200 mm | 2000 mm | 25 mm | - |
| **Web Thickness** | `tw` | 6 mm | 40 mm | - | Standard thicknesses |
| **Flange Width** (Symmetric) | `bf` | 100 mm | 1000 mm | 10 mm | - |
| **Top Flange Width** (Unsymmetric) | `bf_top` | 100 mm | 1000 mm | 10 mm | - |
| **Bottom Flange Width** (Unsymmetric) | `bf_bot` | 100 mm | 1000 mm | 10 mm | - |
| **Flange Thickness** (Symmetric) | `tf` | 6 mm | 100 mm | - | Standard thicknesses |
| **Top Flange Thickness** (Unsymmetric) | `tf_top` | 6 mm | 100 mm | - | Standard thicknesses |
| **Bottom Flange Thickness** (Unsymmetric) | `tf_bot` | 6 mm | 100 mm | - | Standard thicknesses |
| **Stiffener Spacing** (Thin Web) | `c` | 75 mm | 3000 mm | 25 mm | - |
| **Stiffener Thickness** (Thin Web) | `t_stiff` | 6 mm | 40 mm | - | Standard thicknesses |

**Standard Thickness Values** (for discrete variables):
- Web thickness: 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40 mm
- Flange thickness: 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100 mm

##### Customizing Bounds

Users can customize bounds for any optimization variable:

1. Navigate to Design Preferences → Optimisation Tab
2. Click "Customize" button next to the variable
3. Enter:
   - **Lower Bound**: Minimum value
   - **Upper Bound**: Maximum value
   - **Step Size**: Increment for continuous variables (optional)
4. Click "Add" to save

**Note**: For discrete variables (thicknesses), the system will snap to nearest standard value during optimization.

#### Optimization Parameters

**Location**: Code configuration (not directly user-configurable in current version)

| Parameter | Value | Description |
|-----------|-------|-------------|
| **PSO Type** | Intelligent PSO (default) | Optimization algorithm variant |
| **Number of Particles** | 50 | Swarm size |
| **Number of Iterations** | 100 | Maximum iterations |
| **Inertia Weight (w)** | 0.4 | PSO inertia parameter |
| **Cognitive Coefficient (c1)** | 1.5 | Personal best influence |
| **Social Coefficient (c2)** | 1.5 | Global best influence |
| **Penalty Coefficient** | 1,000,000 | Constraint violation penalty multiplier |

#### Optimization Variables Structure

The variables optimized depend on section configuration:

**Symmetric Section (Thick Web)**:
- `D`: Total depth
- `tw`: Web thickness
- `bf`: Flange width (same for top and bottom)
- `tf`: Flange thickness (same for top and bottom)

**Symmetric Section (Thin Web)**:
- `D`: Total depth
- `tw`: Web thickness
- `bf`: Flange width
- `tf`: Flange thickness
- `c`: Intermediate stiffener spacing
- `t_stiff`: Intermediate stiffener thickness

**Unsymmetric Section (Thick Web)**:
- `D`: Total depth
- `tw`: Web thickness
- `bf_top`: Top flange width
- `bf_bot`: Bottom flange width
- `tf_top`: Top flange thickness
- `tf_bot`: Bottom flange thickness

**Unsymmetric Section (Thin Web)**:
- `D`: Total depth
- `tw`: Web thickness
- `bf_top`: Top flange width
- `bf_bot`: Bottom flange width
- `tf_top`: Top flange thickness
- `tf_bot`: Bottom flange thickness
- `c`: Intermediate stiffener spacing
- `t_stiff`: Intermediate stiffener thickness

---

## Outputs

The Plate Girder module provides comprehensive output results after design completion.

### Output Dock Parameters

**Location**: Output Dock (visible in main window after design)

| Output Parameter | Key | Description | Units |
|------------------|-----|-------------|-------|
| **Optimum Designation** | `KEY_TITLE_OPTIMUM_DESIGNATION` | Section designation/identifier | - |
| **Utilization Ratio** | `KEY_OPTIMUM_UR_COMPRESSION` | Maximum utilization ratio (moment/shear/deflection) | - |
| **Section Classification** | `KEY_OPTIMUM_SC` | Section class (Plastic/Compact/Semi-Compact/Slender) | - |
| **Beta_b Constant** | `KEY_betab_constatnt` | Beta_b value for lateral-torsional buckling | - |
| **Effective Section Area** | `KEY_EFF_SEC_AREA` | Effective area for compression | mm² |
| **Web Thickness** | `KEY_WEB_THICKNESS_PG` | Provided web thickness | mm |
| **Top Flange Thickness** | `KEY_TOP_FLANGE_THICKNESS_PG` | Provided top flange thickness | mm |
| **Bottom Flange Thickness** | `KEY_BOTTOM_FLANGE_THICKNESS_PG` | Provided bottom flange thickness | mm |
| **Intermediate Stiffener Thickness** | `KEY_IntermediateStiffener_thickness` | Intermediate stiffener thickness | mm |
| **Intermediate Stiffener Spacing** | `KEY_IntermediateStiffener_spacing` | Spacing between intermediate stiffeners | mm |
| **Longitudinal Stiffener Thickness** | `KEY_LongitudnalStiffener_thickness` | Longitudinal stiffener thickness | mm |
| **Longitudinal Stiffener Numbers** | `KEY_LongitudnalStiffener_numbers` | Number of longitudinal stiffeners | - |
| **End Panel Stiffener Thickness** | `KEY_EndpanelStiffener_thickness` | End panel stiffener thickness | mm |
| **Design Bending Strength** | `KEY_MOMENT_STRENGTH` | Design moment capacity | kNm |
| **Weld for Web to Flange** | `KEY_WeldWebtoflange` | Fillet weld size for web-flange connection | mm |
| **Weld for Stiffener to Web** | `KEY_WeldStiffenertoweb` | Fillet weld size for stiffener-web connection | mm |
| **T Constant** | `KEY_T_constatnt` | Torsional constant (for LTB) | mm⁴ |
| **W Constant** | `KEY_W_constatnt` | Warping constant (for LTB) | mm⁶ |
| **Longitudinal Stiffener 1 Position** | `KEY_LongitudinalStiffener1_pos` | Position of first longitudinal stiffener | mm |
| **Longitudinal Stiffener 2 Position** | `KEY_LongitudinalStiffener2_pos` | Position of second longitudinal stiffener | mm |
| **Elastic Critical Moment** | `KEY_Elastic_CM` | Elastic critical moment for LTB | kNm |
| **Calculated Deflection** | `KEY_MAX_DEFL` | Maximum deflection under service loads | mm |
| **Deflection Limit** | `DeflectionLimit` | Allowable deflection limit | mm |

### Design Status

The module provides a boolean `design_status` flag indicating:
- **True**: All design checks passed
- **False**: One or more design checks failed

### Utilization Ratios

The module calculates and reports utilization ratios for:
- **Moment Ratio**: Applied Moment / Design Moment Capacity
- **Shear Ratio**: Applied Shear / Design Shear Capacity
- **Deflection Ratio**: Calculated Deflection / Allowable Deflection

The **maximum utilization ratio** is reported as the overall design efficiency metric.

### Section Properties (Internal)

The module calculates and uses (but may not display) the following section properties:
- Area (A)
- Moment of Inertia about X-axis (Ixx)
- Moment of Inertia about Y-axis (Iyy)
- Plastic Modulus (Zp)
- Elastic Modulus (Ze)
- Radius of Gyration (r)
- Centroid position (for unsymmetric sections)
- yj value (for unsymmetric sections, per IS 800:2007 E.3.2.2)

### Design Check Results (Internal)

The module performs and stores results for:
- **Section Classification**: Plastic/Compact/Semi-Compact/Slender
- **Moment Capacity Check**: Pass/Fail with ratio
- **Shear Capacity Check**: Pass/Fail with ratio
- **Web Buckling Check**: Pass/Fail
- **Web Crippling Check**: Pass/Fail
- **Deflection Check**: Pass/Fail with ratio
- **Weld Design**: Weld sizes and capacities

---

## Module Architecture

### Core Components

```
plate_girder/
├── core/
│   ├── plate_girder.py      # Main design class (PlateGirderWelded)
│   ├── pso_optimizer.py     # Global Best PSO implementation
│   ├── section.py            # Section properties and classification
│   └── utils.py              # Utility functions
├── optimization/
│   └── intelligent_pso.py   # Intelligent PSO with discrete variables
├── checks/
│   ├── moment.py             # Moment capacity checks
│   ├── shear.py              # Shear capacity checks
│   ├── web_buckling.py       # Web buckling checks
│   ├── web_crippling.py      # Web crippling checks
│   ├── web_thickness.py     # Web thickness validation
│   ├── deflection.py         # Deflection checks
│   └── welds.py              # Weld design
├── gui/
│   ├── dialogs.py            # Input dialogs (RangeInputDialog, PopupDialog)
│   ├── pso_ui_manager.py     # PSO visualization lifecycle management
│   └── widgets.py            # Custom widgets
├── visualization/
│   └── pso_visualizer.py     # Real-time 3D visualization dashboard
└── report/
    └── latex_report.py       # LaTeX report generation
```

### Main Class: `PlateGirderWelded`

The main class inherits from `Member` and handles:

- Design preference management
- Input validation
- Section design (manual and optimized)
- Design checks
- Report generation

**Key Methods:**
- `optimized_method()`: Main PSO optimization entry point
- `objective_function()`: PSO objective (minimize weight + penalties)
- `evaluate_particle_cost()`: Evaluates a particle's fitness
- `design_check()`: Full design validation
- `design_check_optimized_version()`: Fast version for PSO iterations

---

## Optimization System

### Optimization Flow

```
User Input → Design Dictionary → optimized_method()
    ↓
Build Variable Structure (symmetric/unsymmetric, thick/thin web)
    ↓
Get Bounds (from user input or defaults)
    ↓
Initialize PSO Optimizer (IntelligentPSO or GlobalBestPSO)
    ↓
Generate First Particle (knowledge injection)
    ↓
PSO Loop (100 iterations, 50 particles):
    For each iteration:
        For each particle:
            1. Snap to discrete values (if IntelligentPSO)
            2. Evaluate objective function
            3. Update personal best
            4. Update global best
            5. Emit visualization callback
            6. Update velocity and position
    ↓
Extract Best Solution
    ↓
Round to Standard Values
    ↓
Final Design Check
    ↓
Display Results
```

### Variable Structure

The optimization variables depend on section type:

**Symmetric Section:**
- `D`: Total depth (200-2000 mm, step 25)
- `tw`: Web thickness (6-40 mm, discrete)
- `bf`: Flange width (100-1000 mm, step 10)
- `tf`: Flange thickness (6-100 mm, discrete)
- `c`: Stiffener spacing (75-3000 mm, step 25) - if thin web
- `t_stiff`: Stiffener thickness (6-40 mm, discrete) - if thin web

**Unsymmetric Section:**
- `D`: Total depth
- `tw`: Web thickness
- `bf_top`: Top flange width
- `bf_bot`: Bottom flange width
- `tf_top`: Top flange thickness
- `tf_bot`: Bottom flange thickness
- `c`: Stiffener spacing (if thin web)
- `t_stiff`: Stiffener thickness (if thin web)

### Objective Function

The objective function minimizes:

```
Cost = Mass + Penalty × (Constraint Violations)
```

Where:
- **Mass** = Area × Length × Density (kg)
- **Penalty Coefficient** = 1,000,000

**Penalty Components:**
1. Slender section: +2.0
2. Web thickness violation: +1.5
3. Shear ratio > 1.0: +(shear_ratio - 1.0)
4. Moment ratio > 1.0: +(moment_ratio - 1.0)
5. Web buckling/crippling failure: +1.0
6. Deflection failure: +1.0

### Intelligent PSO Features

**Discrete Variable Support:**
- Snaps continuous values to nearest standard thicknesses
- Maintains continuous search space for better exploration
- Only snaps during evaluation, not during velocity updates

**Smart Boundary Handling:**
- Clamps particles to bounds instead of random resampling
- Sets velocity to zero at boundaries (inelastic collision)
- Prevents particles from escaping search space

**Configuration:**
```python
USE_INTELLIGENT_PSO = True  # Set in plate_girder.py
```

### Global Best PSO Features

**Constraint Handling:**
- Feasible initialization (only feasible particles)
- Constraint checking during position updates
- Resampling if particle becomes infeasible

**Progress Callback:**
- Emits data for each particle evaluation
- Includes iteration, particle index, position, and cost
- Used for real-time visualization

---

## Real-Time Visualization

### Visualization Architecture

The visualization system consists of three main components:

1. **PSOUIManager** (`gui/pso_ui_manager.py`):
   - Manages widget lifecycle (CAD ↔ PSO swap)
   - Handles toggle functionality (Alt+G)
   - Coordinates with TemplatePage

2. **PSOVisualizerWidget** (`visualization/pso_visualizer.py`):
   - Main visualization widget
   - Contains MatplotlibCanvas
   - Manages replay functionality

3. **MatplotlibCanvas** (`visualization/pso_visualizer.py`):
   - Three-panel dashboard rendering
   - Real-time plot updates

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│  PSO OPTIMIZATION SPACE  │  ITERATION: X  │  BEST: Y kg │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Parallel Coordinates Plot (Top Panel)           │  │
│  │  Shows: Design Variable Convergence              │  │
│  │  - History (faint background)                   │  │
│  │  - Current Swarm (bold lines)                    │  │
│  │  - Global Best (gold dashed line)                 │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────┐  ┌──────────────────────┐  │
│  │ Performance Map      │  │ Cross-Section Preview │  │
│  │ (Bottom Left)        │  │ (Bottom Right)        │  │
│  │ Weight vs UR         │  │ Best Section Drawing  │  │
│  │ - History points     │  │ - Dimensions labeled │  │
│  │ - Current swarm      │  │ - To scale            │  │
│  │ - Feasibility line   │  │                       │  │
│  └──────────────────────┘  └──────────────────────┘  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  ⏮ ◀ ▶ ⏭  [Once/Loop]  💾 Save  Frame: X/Y  Legend   │
└─────────────────────────────────────────────────────────┘
```

### Panel Details

#### 1. Parallel Coordinates Plot

**Purpose:** Visualize how design variables converge during optimization

**Features:**
- X-axis: Design variables (D, tw, bf, tf, etc.)
- Y-axis: Normalized range (0-100%)
- Lines: Each particle's position across all variables
- Colors:
  - Blue: Feasible particles (UR ≤ 1.0)
  - Red: Infeasible particles (UR > 1.0)
  - Gold: Global best (dashed line with markers)

**Data Flow:**
1. Particle positions normalized: `(val - lb) / (ub - lb) × 100`
2. History rendered as faint background (last 2000 points)
3. Current swarm rendered as bold lines
4. Global best highlighted in gold

#### 2. Performance Map

**Purpose:** Show objective space (Weight vs Utilization Ratio)

**Features:**
- X-axis: Weight (kg)
- Y-axis: Utilization Ratio (UR)
- Red line at UR = 1.0 (feasibility limit)
- Scatter points:
  - History: Faint background (last 3000 points)
  - Current swarm: Bold points
  - Colors: Green (feasible), Red (infeasible)
- Global best: Gold diamond marker

**Dynamic Scaling:**
- X-axis: Auto-scales to min/max weight with 10% margin
- Y-axis: 0 to max(2.0, max_UR)

#### 3. Cross-Section Preview

**Purpose:** Visualize the best cross-section found so far

**Features:**
- To-scale drawing of plate girder cross-section
- Shows:
  - Bottom flange (rectangle)
  - Web (rectangle)
  - Top flange (rectangle)
- Annotations:
  - Depth (D) and web thickness (tw) in center
  - Bottom flange dimensions below
  - Top flange dimensions above

**Updates:**
- Only shows feasible solutions (UR ≤ 1.0)
- Updates when global best changes
- Uses global best position vector

### Data Processing

**DataProcessor Class:**
- Thread-safe data collection (RLock)
- Memory limits (MAX_HISTORY_ENTRIES = 10000)
- Tracks:
  - Particle positions
  - Utilization ratios
  - Weights
  - Iteration numbers
  - Variable names and bounds

**Update Mechanism:**
- Batch buffering (20 particles per flush)
- Render timer (100ms = 10 FPS)
- Throttled to once per iteration (not per particle)

### Replay Functionality

**Features:**
- Frame-by-frame navigation
- Play/pause animation
- Loop mode (once/loop)
- Step controls (⏮ first, ◀ previous, ▶ next, ⏭ last)
- Save as PNG (convergence plot)

**Caching:**
- Builds frame cache after optimization completes
- One frame per iteration (last particle state)
- Smooth playback at 5 FPS

### Integration with Optimization

**Callback Chain:**
```
PSO Optimizer
    ↓ (progress_callback)
pso_progress_callback (in optimized_method)
    ↓ (viz_callback)
PSOUIManager._viz_callback
    ↓ (add_particle_data)
PSOVisualizerWidget.add_particle_data
    ↓ (batch buffer)
DataProcessor.add_particle_data
    ↓ (render timer)
MatplotlibCanvas.update_plot
```

**Synchronization:**
- Optimization runs on main thread (OpenGL safety)
- `QApplication.processEvents()` called once per iteration
- UI updates throttled to prevent lag

---

## Design Checks

### Check Modules

All design checks are in `checks/` directory and follow IS 800:2007:

#### 1. Section Classification (`checks/__init__.py`, `core/section.py`)

**Purpose:** Classify section as Plastic/Compact/Semi-Compact/Slender

**Criteria:**
- **Flanges**: Table 2, Sr. No. (i) - Outstanding element
- **Web**: 
  - Table 2 limits for moment capacity
  - Clause 8.6.1.2 for plate girder validity:
    - d/tw ≤ 200ε (transverse stiffeners only)
    - d/tw ≤ 250ε (transverse + longitudinal stiffeners)

**Returns:**
- Section class string
- `is_valid`: True if not slender

#### 2. Moment Capacity (`checks/moment.py`)

**Function:** `corrected_design_bending_strength()`

**Checks:**
- Plastic modulus (Zp) for Plastic sections
- Elastic modulus (Ze) for Compact/Semi-Compact sections
- Lateral-torsional buckling (LTB) reduction
- Web buckling under moment (Clause 8.2.1.2)

**Output:**
- `moment_ratio` = Applied Moment / Design Moment Capacity

#### 3. Shear Capacity (`checks/shear.py`)

**Checks:**
- Web shear capacity (Clause 8.4)
- Shear buckling (Clause 8.4.2) if thin web
- Post-buckling strength (tension field action)

**Output:**
- `shear_ratio` = Applied Shear / Design Shear Capacity

#### 4. Web Buckling (`checks/web_buckling.py`)

**Checks:**
- Web buckling under concentrated loads (Clause 8.7.3)
- Buckling coefficient calculation
- Effective width method

**Output:**
- Boolean: `shearchecks` (True if passes)

#### 5. Web Crippling (`checks/web_crippling.py`)

**Checks:**
- Web crippling under concentrated loads (Clause 8.7.4)
- Bearing capacity calculation

**Output:**
- Boolean: `shearchecks` (True if passes)

#### 6. Deflection (`checks/deflection.py`)

**Function:** `evaluate_deflection_kNm_mm()`

**Checks:**
- Maximum deflection under service loads
- Comparison with limits (L/250, L/300, etc.)

**Output:**
- `deflection_ratio` = Actual Deflection / Allowable Deflection
- `defl_check` (True if passes)

#### 7. Weld Design (`checks/welds.py`)

**Function:** `design_welds_with_strength_web_to_flange()`

**Checks:**
- Fillet weld size for web-to-flange connection
- Weld strength per IS 800:2007

**Output:**
- Weld size and strength

### Design Check Flow

```
design_check_optimized_version() [Fast version for PSO]
    ↓
1. Section Classification
    ↓
2. Section Properties Calculation
    - Area, Ixx, Iyy, Zp, Ze
    - Centroid, yj (for unsymmetric)
    ↓
3. Moment Capacity Check
    ↓
4. Shear Capacity Check
    ↓
5. Web Buckling Check (if applicable)
    ↓
6. Web Crippling Check (if applicable)
    ↓
7. Deflection Check (if enabled)
    ↓
Return: (max_ratio, slender_ok, thickness_ok)
```

**Note:** Full `design_check()` also includes:
- Weld design
- Detailed logging
- Report generation

---

## File Structure

### Core Files

#### `core/plate_girder.py` (Main Design Class)

**Key Methods:**

1. **`optimized_method(design_dictionary, is_thick_web, is_symmetric, viz_callback=None)`**
   - Main PSO optimization entry point
   - Builds variable structure
   - Initializes optimizer
   - Runs optimization loop
   - Extracts and rounds best solution

2. **`objective_function(particle, variable_list, design_dictionary, is_symmetric, is_thick_web)`**
   - Wrapper for `evaluate_particle_cost()`

3. **`evaluate_particle_cost(particle, variable_list, design_dictionary, is_symmetric, is_thick_web)`**
   - Assigns particle to section
   - Runs fast design check
   - Calculates mass
   - Applies penalties
   - Returns cost

4. **`design_check_optimized_version(design_dictionary)`**
   - Fast version for PSO iterations
   - Skips weld design and detailed logging
   - Returns ratios and flags

5. **`build_variable_structure(is_thick_web, is_symmetric)`**
   - Returns list of variable names based on section type

6. **`get_bounds(variable_list)`**
   - Returns lower and upper bounds for each variable

#### `core/pso_optimizer.py` (Global Best PSO)

**Class:** `GlobalBestPSO`

**Features:**
- Constraint-aware initialization
- Feasible particle generation
- Constraint checking during updates
- Progress callback support

**Method:** `optimize(objective_func, iters, debug, progress_callback)`

#### `optimization/intelligent_pso.py` (Intelligent PSO)

**Class:** `IntelligentPSO`

**Features:**
- Discrete variable snapping
- Smart boundary clamping
- Soft constraint handling (penalties)
- Continuous search space with discrete evaluation

**Method:** `optimize(objective_func, iters, debug, progress_callback)`

#### `core/section.py` (Section Utilities)

**Functions:**
- `calc_yj()`: Calculate yj for unsymmetric sections (IS 800:2007 E.3.2.2)
- `shear_stress_unsym_I()`: Calculate shear stress distribution
- `classify_section()`: Classify plate girder section

#### `visualization/pso_visualizer.py` (Visualization)

**Classes:**
1. **`DataProcessor`**: Thread-safe data collection and processing
2. **`MatplotlibCanvas`**: Three-panel dashboard rendering
3. **`PSOVisualizerWidget`**: Main widget with controls

**Key Methods:**
- `add_particle_data()`: Add data from optimization
- `update_plot()`: Update dashboard
- `_build_frame_cache()`: Build replay cache
- `save_animation()`: Save convergence plot

#### `gui/pso_ui_manager.py` (UI Management)

**Class:** `PSOUIManager`

**Methods:**
- `start_visualization()`: Start PSO with visualization
- `restore_cad_from_pso()`: Switch from PSO to CAD view
- `show_pso_from_cad()`: Switch from CAD to PSO view
- `toggle_view()`: Toggle between views (Alt+G)
- `cleanup()`: Clean up resources

#### `gui/dialogs.py` (Input Dialogs)

**Classes:**
1. **`RangeInputDialog`**: Input for custom ranges (lower, upper, step)
2. **`PopupDialog`**: Selection dialog for customized values

---

## Workflow Diagrams

### Complete Design Flow

```
┌─────────────────┐
│  User Input     │
│  (Design Pref)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Design Type?    │
│ - Manual        │
│ - Optimized     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐  ┌──────────────┐
│Manual │  │  Optimized   │
│Design │  │  (PSO)       │
└───────┘  └──────┬───────┘
                  │
                  ▼
         ┌────────────────┐
         │ Initialize PSO │
         │ - Variables    │
         │ - Bounds       │
         │ - Optimizer    │
         └────────┬───────┘
                  │
                  ▼
         ┌────────────────┐
         │ PSO Loop       │
         │ (100 iter)     │
         └────────┬───────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
    ┌─────────┐      ┌──────────────┐
    │Evaluate │      │Visualization │
    │Particle │◄─────┤Callback      │
    └────┬────┘      └──────────────┘
         │
         ▼
    ┌──────────────┐
    │Design Check  │
    │(Fast)        │
    └────┬─────────┘
         │
         ▼
    ┌──────────────┐
    │Calculate Cost│
    │(Mass+Penalty)│
    └────┬─────────┘
         │
         ▼
    ┌──────────────┐
    │Update Bests  │
    └────┬─────────┘
         │
         ▼
    ┌──────────────┐
    │Best Solution │
    └────┬─────────┘
         │
         ▼
    ┌──────────────┐
    │Round to Std  │
    └────┬─────────┘
         │
         ▼
    ┌──────────────┐
    │Final Check   │
    └────┬─────────┘
         │
         ▼
    ┌──────────────┐
    │Display Result│
    └──────────────┘
```

### Visualization Flow

```
┌─────────────────────┐
│User Clicks "Design" │
│(Optimized Type)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│PSOUIManager         │
│.start_visualization()│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│Create               │
│PSOVisualizerWidget  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│Replace CAD Widget   │
│with PSO Widget      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│Start Optimization   │
│(Main Thread)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│PSO Loop             │
│(For each particle)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│progress_callback()  │
│(Emit data)          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│viz_callback()       │
│(PSOUIManager)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│add_particle_data()   │
│(PSOVisualizerWidget)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│Batch Buffer         │
│(20 particles)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│DataProcessor        │
│.add_particle_data() │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│Render Timer         │
│(100ms = 10 FPS)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│MatplotlibCanvas      │
│.update_plot()       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│Update Dashboard     │
│(3 Panels)           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│Optimization Complete│
│Auto-switch to CAD   │
│(1.5s delay)         │
└─────────────────────┘
```

---

## Key Algorithms

### 1. PSO Velocity Update

**Standard PSO:**
```
V_new = w × V_old + c1 × r1 × (P_best - X) + c2 × r2 × (G_best - X)
X_new = X_old + V_new
```

Where:
- `w` = inertia weight (0.4)
- `c1` = cognitive coefficient (1.5)
- `c2` = social coefficient (1.5)
- `r1`, `r2` = random numbers [0, 1]
- `P_best` = particle's personal best
- `G_best` = global best

**Intelligent PSO Boundary Handling:**
```python
# Clamp to bounds
X = np.clip(X, lb, ub)

# Zero velocity at boundaries
V[X == lb] = 0
V[X == ub] = 0
```

### 2. Discrete Variable Snapping

```python
def snap_to_discrete(particle, discrete_lists):
    snapped = particle.copy()
    for idx, standards in discrete_lists.items():
        if idx < len(snapped):
            val = snapped[idx]
            closest = min(standards, key=lambda x: abs(x - val))
            snapped[idx] = closest
    return snapped
```

**Usage:**
- Continuous search space for better exploration
- Discrete evaluation for realistic designs
- Only snaps during evaluation, not during velocity updates

### 3. Objective Function Calculation

```python
def evaluate_particle_cost(particle):
    # 1. Assign to section
    assign_particle_to_section(particle)
    
    # 2. Run design checks
    max_ratio, slender_ok, thickness_ok = design_check_optimized_version()
    
    # 3. Calculate mass
    area = (top_flange_area + bottom_flange_area + web_area)
    volume = area × length
    mass = volume × 7.85e-6  # kg (steel density)
    
    # 4. Calculate penalties
    penalty = 0.0
    if not slender_ok:
        penalty += 2.0
    if not thickness_ok:
        penalty += 1.5
    if shear_ratio > 1.0:
        penalty += (shear_ratio - 1.0)
    if moment_ratio > 1.0:
        penalty += (moment_ratio - 1.0)
    if not shearchecks:
        penalty += 1.0
    if not defl_check:
        penalty += 1.0
    
    # 5. Return cost
    cost = mass + 1e6 × penalty
    return cost
```

### 4. First Particle Generation

**Knowledge Injection:**
```python
def generate_first_particle(length, moment, fy, is_thick_web, is_symmetric):
    # Estimate depth from moment
    Zp_required = moment / (fy / gamma_m0)
    D_estimate = (6 × Zp_required / bf_estimate)^(1/2)
    
    # Estimate flange dimensions
    bf_estimate = D_estimate / 3 to D_estimate / 2
    tf_estimate = bf_estimate / 10 to bf_estimate / 15
    
    # Estimate web thickness
    tw_estimate = D_estimate / 100 to D_estimate / 150
    
    return [D, tw, bf, tf, ...]
```

This provides a good starting point for optimization.

### 5. Parallel Coordinates Normalization

```python
def normalize_position(position, lb, ub):
    norm_pos = []
    for i, val in enumerate(position):
        span = ub[i] - lb[i]
        if span == 0:
            span = 1  # Avoid division by zero
        norm = (val - lb[i]) / span × 100
        norm_pos.append(norm)
    return norm_pos
```

This converts actual dimensions to 0-100% range for visualization.

---

## Configuration

### PSO Parameters

**Location:** `core/plate_girder.py`

```python
USE_INTELLIGENT_PSO = True  # Use Intelligent PSO (default)
DEBUG_MODE = False          # Enable debug printing
```

**Optimizer Settings:**
```python
n_particles = 50
iterations = 100
options = {
    'w': 0.4,   # Inertia weight
    'c1': 1.5,  # Cognitive coefficient
    'c2': 1.5   # Social coefficient
}
```

### Default Bounds

**Location:** `core/plate_girder.py` (in `__init__`)

```python
self.bounds_map = {
    'tf': (6, 100),
    'tf_top': (6, 100),
    'tf_bot': (6, 100),
    'tw': (6, 40),
    'bf': (100, 1000),
    'bf_top': (100, 1000, 10),  # step size
    'bf_bot': (100, 1000, 10),
    'D': (200, 2000, 25),
    'c': (75, 3000),
    't_stiff': (6, 40)
}
```

### Visualization Settings

**Location:** `visualization/pso_visualizer.py`

```python
MAX_HISTORY_ENTRIES = 10000  # Memory limit
MAX_PARTICLES = 100
RENDER_INTERVAL = 100  # ms (10 FPS)
REPLAY_SPEED = 200  # ms per frame (5 FPS)
```

### Design Check Flags

**Location:** `checks/__init__.py`

```python
SKIP_DEFLECTION = False  # Set True to skip deflection checks
```

---

## Usage Examples

### Running Optimized Design

1. **Select Design Type:**
   - Open Design Preferences
   - Go to "Design" tab
   - Select "Optimized" from dropdown

2. **Set Bounds (Optional):**
   - Go to "Optimisation" tab
   - Click "Customize" for any variable
   - Set lower bound, upper bound, step size

3. **Run Design:**
   - Click "Design" button
   - PSO visualization appears automatically
   - Watch real-time optimization progress

4. **View Results:**
   - After optimization, view switches to CAD
   - Press Alt+G to toggle back to optimization graph
   - Use replay controls to review optimization history

### Customizing Variables

**Example: Custom Depth Range**
1. In "Optimisation" tab, find "D" (Total Depth)
2. Click "Customize"
3. Enter:
   - Lower Bound: 500
   - Upper Bound: 1500
   - Step: 25
4. Click "Add"
5. Run design

### Understanding Visualization

**Parallel Coordinates:**
- Lines moving left = variables decreasing
- Lines moving right = variables increasing
- Gold line = best solution found

**Performance Map:**
- Points below red line (UR < 1.0) = feasible
- Points above red line (UR > 1.0) = infeasible
- Gold diamond = best feasible solution

**Cross-Section:**
- Shows best section found so far
- Updates in real-time
- Dimensions labeled

---

## Troubleshooting

### Optimization Not Finding Solution

**Possible Causes:**
1. Bounds too restrictive
2. Constraints too tight
3. No feasible region

**Solutions:**
- Widen bounds in "Optimisation" tab
- Check design loads
- Review material properties

### Visualization Not Appearing

**Possible Causes:**
1. Design type not "Optimized"
2. Visualization module not loaded
3. OpenGL issues

**Solutions:**
- Verify "Optimized" is selected
- Check console for import errors
- Update graphics drivers

### Slow Performance

**Possible Causes:**
1. Too many particles
2. Too many iterations
3. Complex design checks

**Solutions:**
- Reduce particles (edit `n_particles` in code)
- Reduce iterations (edit `iters` in code)
- Disable deflection checks temporarily

---

## Future Enhancements

Potential improvements:

1. **Adaptive PSO:**
   - Adjust parameters during optimization
   - Dynamic particle count

2. **Multi-Objective Optimization:**
   - Pareto front visualization
   - Weight vs Cost trade-off

3. **Advanced Visualization:**
   - 3D scatter plot of search space
   - Interactive parameter adjustment

4. **Parallel Processing:**
   - Multi-threaded particle evaluation
   - GPU acceleration

---

## References

- **IS 800:2007**: Indian Standard for General Construction in Steel
- **PSO Algorithm**: Kennedy & Eberhart (1995)
- **Osdag Documentation**: Internal design guidelines

---

## Conclusion

The Plate Girder module is a sophisticated optimization system that combines:
- Advanced PSO algorithms
- Real-time visualization
- Comprehensive design checks
- User-friendly interface

It provides engineers with an efficient tool for designing optimal plate girders while ensuring code compliance and structural safety.

