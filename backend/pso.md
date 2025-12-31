# PSO Algorithm Reusability Analysis

## Location of PSO Algorithms

The PSO (Particle Swarm Optimization) algorithms are located in:

### Core PSO Implementations

1. **Global Best PSO** (Standard PSO with constraint handling)
   - **File**: `osdag_core/design_type/plate_girder/core/pso_optimizer.py`
   - **Class**: `GlobalBestPSO`
   - **Function**: `pso()` (standalone function)

2. **Intelligent PSO** (PSO with discrete variable support)
   - **File**: `osdag_core/design_type/plate_girder/optimization/intelligent_pso.py`
   - **Class**: `IntelligentPSO`
   - **Features**: 
     - Discrete variable snapping
     - Smart boundary handling
     - Soft constraint handling

3. **Legacy PSO** (Older version, may be deprecated)
   - **File**: `osdag_core/design_type/plate_girder/pso.py`
   - **Function**: `pso()` (standalone function)

### Supporting Files

4. **Visualization** (Qt/PySide6 dependent)
   - **File**: `osdag_core/design_type/plate_girder/visualization/pso_visualizer.py`
   - **Dependencies**: PySide6, Matplotlib
   - **Reusability**: ❌ **NOT portable** (GUI framework dependent)

5. **UI Manager** (Qt/PySide6 dependent)
   - **File**: `osdag_core/design_type/plate_girder/gui/pso_ui_manager.py`
   - **Dependencies**: PySide6
   - **Reusability**: ❌ **NOT portable** (GUI framework dependent)

6. **Utility Functions**
   - **File**: `osdag_core/design_type/plate_girder/core/utils.py`
   - **Functions**: `ceil_to_nearest()`, `get_K_from_warping_restraint()`
   - **Reusability**: ✅ **Portable** (pure Python, no dependencies)

---

## Reusability Analysis

### ✅ **FULLY REUSABLE** (Can be moved to osdag-core or website repo)

#### 1. **Intelligent PSO** (`intelligent_pso.py`)
```python
# Dependencies: ONLY numpy
import numpy as np
import random  # (built-in, no external dependency)

# Features:
# - Discrete variable support
# - Smart boundary clamping
# - Progress callback support
# - No GUI dependencies
```

**Portability**: ✅ **100% Portable**
- **Dependencies**: `numpy` only
- **No GUI dependencies**
- **No Osdag-specific code**
- **Can be used in web backend, CLI, or any Python environment**

**Usage Example**:
```python
from intelligent_pso import IntelligentPSO

# Initialize
optimizer = IntelligentPSO(
    n_particles=50,
    dimensions=4,
    options={'w': 0.4, 'c1': 1.5, 'c2': 1.5},
    bounds=([200, 6, 100, 6], [2000, 40, 1000, 100]),
    discrete_lists={1: [6, 8, 10, 12, 14, 16, 18, 20],  # tw
                    3: [6, 8, 10, 12, 14, 16, 18, 20]}  # tf
)

# Define objective function
def objective(particle):
    # Your optimization logic here
    return cost

# Run optimization
best_score, best_position = optimizer.optimize(
    objective_func=objective,
    iters=100,
    progress_callback=lambda it, idx, pos, score: print(f"Iter {it}, Score: {score}")
)
```

#### 2. **Global Best PSO** (`pso_optimizer.py`)
```python
# Dependencies: ONLY numpy, math (built-in)
import numpy as np
import math  # (built-in)

# Features:
# - Constraint-aware initialization
# - Feasible particle generation
# - Progress callback support
# - Constraint checking during updates
```

**Portability**: ✅ **100% Portable**
- **Dependencies**: `numpy` only
- **No GUI dependencies**
- **Can be used standalone**

**Usage Example**:
```python
from pso_optimizer import GlobalBestPSO

# Initialize
optimizer = GlobalBestPSO(
    n_particles=50,
    dimensions=4,
    options={'w': 0.4, 'c1': 1.5, 'c2': 1.5},
    bounds=([200, 6, 100, 6], [2000, 40, 1000, 100])
)

# Run optimization
best_score, best_position = optimizer.optimize(
    objective_func=objective,
    iters=100,
    progress_callback=callback
)
```

#### 3. **Utility Functions** (`utils.py`)
```python
# Dependencies: ONLY math (built-in)
import math  # (built-in)

# Functions:
# - ceil_to_nearest(x, multiple)
# - get_K_from_warping_restraint(warping_condition)
```

**Portability**: ✅ **100% Portable**
- **Dependencies**: None (only built-in `math`)
- **Pure Python functions**

---

### ❌ **NOT REUSABLE** (GUI/Osdag-specific)

#### 1. **PSO Visualizer** (`pso_visualizer.py`)
- **Dependencies**: PySide6, Matplotlib (Qt backend)
- **Purpose**: Real-time GUI visualization
- **Reusability**: ❌ **NOT portable** - Requires Qt/PySide6
- **Alternative**: Can be reimplemented for web using:
  - Plotly/Dash for web visualization
  - WebSocket for real-time updates
  - Or use the progress callback to send data to frontend

#### 2. **PSO UI Manager** (`pso_ui_manager.py`)
- **Dependencies**: PySide6
- **Purpose**: Manages widget lifecycle in Osdag GUI
- **Reusability**: ❌ **NOT portable** - Osdag-specific GUI code

#### 3. **GUI Dialogs** (`gui/dialogs.py`, `gui/widgets.py`)
- **Dependencies**: PySide6
- **Reusability**: ❌ **NOT portable** - GUI-specific

---

## Recommended Structure for osdag-core

If moving to `osdag-core`, suggested structure:

```
osdag-core/
├── optimization/
│   ├── __init__.py
│   ├── pso/
│   │   ├── __init__.py
│   │   ├── intelligent_pso.py      # ✅ Portable
│   │   ├── global_best_pso.py      # ✅ Portable (rename from pso_optimizer.py)
│   │   └── base_pso.py              # Optional: Abstract base class
│   └── utils.py                     # ✅ Portable (from plate_girder/core/utils.py)
```

### Minimal Dependencies

**requirements.txt** for osdag-core optimization module:
```
numpy>=1.20.0
```

That's it! No GUI, no Qt, no Matplotlib needed for the core PSO algorithms.

---

## Web/API Integration Strategy

### Backend (Python/Flask/FastAPI)

```python
# api/optimization.py
from osdag_core.optimization.pso.intelligent_pso import IntelligentPSO
import numpy as np

def optimize_plate_girder(params):
    """API endpoint for plate girder optimization"""
    
    # Extract parameters
    bounds = params['bounds']
    discrete_lists = params.get('discrete_lists', None)
    
    # Initialize optimizer
    optimizer = IntelligentPSO(
        n_particles=50,
        dimensions=len(bounds[0]),
        options={'w': 0.4, 'c1': 1.5, 'c2': 1.5},
        bounds=bounds,
        discrete_lists=discrete_lists
    )
    
    # Collect progress data
    progress_data = []
    
    def progress_callback(iter, idx, pos, score):
        progress_data.append({
            'iteration': iter,
            'particle': idx,
            'position': pos.tolist(),
            'score': float(score)
        })
    
    # Run optimization
    best_score, best_position = optimizer.optimize(
        objective_func=objective_function,
        iters=100,
        progress_callback=progress_callback
    )
    
    return {
        'best_score': float(best_score),
        'best_position': best_position.tolist(),
        'progress': progress_data
    }
```

### Frontend (JavaScript/React)

```javascript
// Use WebSocket or Server-Sent Events for real-time updates
const ws = new WebSocket('ws://api/optimize');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    updateVisualization(data.progress);
};
```

### Alternative: REST API with Polling

```python
# Start optimization job
POST /api/optimize/start
→ Returns: {job_id: "abc123"}

# Poll for progress
GET /api/optimize/status/{job_id}
→ Returns: {status: "running", progress: [...], best_so_far: {...}}

# Get final result
GET /api/optimize/result/{job_id}
→ Returns: {best_score: 123.45, best_position: [...], ...}
```

---

## What Can Be Reused in Website Repo?

### ✅ **Directly Reusable**

1. **Intelligent PSO** (`intelligent_pso.py`)
   - Copy to website backend
   - Only needs `numpy`
   - Works in any Python environment

2. **Global Best PSO** (`pso_optimizer.py`)
   - Copy to website backend
   - Only needs `numpy`
   - Works in any Python environment

3. **Utility Functions** (`utils.py`)
   - Copy to website backend
   - No dependencies

### 🔄 **Needs Adaptation**

1. **Progress Callback System**
   - Current: Direct function calls
   - Web: Use WebSocket/SSE to stream progress to frontend
   - Or: Store progress in Redis/database, poll from frontend

2. **Visualization**
   - Current: Matplotlib + Qt
   - Web: Reimplement using:
     - **Plotly.js** for interactive charts
     - **D3.js** for custom visualizations
     - **Chart.js** for simple charts
   - Use progress data from backend

### ❌ **Cannot Be Reused**

1. **Qt/PySide6 GUI Components**
   - `pso_visualizer.py` (Qt widgets)
   - `pso_ui_manager.py` (Qt widgets)
   - `gui/dialogs.py` (Qt dialogs)
   - `gui/widgets.py` (Qt widgets)

---

## Migration Checklist

### For osdag-core

- [ ] Copy `intelligent_pso.py` to `osdag-core/optimization/pso/`
- [ ] Copy `pso_optimizer.py` to `osdag-core/optimization/pso/` (rename to `global_best_pso.py`)
- [ ] Copy relevant functions from `utils.py` to `osdag-core/optimization/utils.py`
- [ ] Update imports in plate_girder module to use osdag-core
- [ ] Add `numpy` to osdag-core requirements
- [ ] Write unit tests for PSO algorithms
- [ ] Document API

### For Website Repo

- [ ] Copy PSO algorithms to backend (e.g., `backend/optimization/pso/`)
- [ ] Create API endpoints for optimization
- [ ] Implement progress streaming (WebSocket/SSE)
- [ ] Create frontend visualization components (Plotly.js/D3.js)
- [ ] Test end-to-end optimization flow
- [ ] Add error handling and validation

---

## Example: Extracting PSO for Standalone Use

### Step 1: Create Standalone Package

```python
# standalone_pso/
# ├── __init__.py
# ├── intelligent_pso.py  # Copy from plate_girder/optimization/
# └── global_best_pso.py  # Copy from plate_girder/core/pso_optimizer.py
```

### Step 2: Minimal Example

```python
# example_usage.py
import numpy as np
from standalone_pso.intelligent_pso import IntelligentPSO

# Define objective function (minimize weight)
def objective(particle):
    D, tw, bf, tf = particle
    # Calculate weight
    area = 2 * bf * tf + D * tw  # Simplified
    weight = area * 7.85e-6  # kg/mm
    return weight

# Setup bounds
bounds = (
    [200, 6, 100, 6],    # Lower bounds: [D, tw, bf, tf]
    [2000, 40, 1000, 100] # Upper bounds
)

# Discrete values for thicknesses
discrete_lists = {
    1: [6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40],  # tw
    3: [6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]  # tf
}

# Initialize optimizer
optimizer = IntelligentPSO(
    n_particles=50,
    dimensions=4,
    options={'w': 0.4, 'c1': 1.5, 'c2': 1.5},
    bounds=bounds,
    discrete_lists=discrete_lists
)

# Run optimization
best_score, best_position = optimizer.optimize(
    objective_func=objective,
    iters=100
)

print(f"Best weight: {best_score:.2f} kg")
print(f"Best dimensions: D={best_position[0]:.0f}, tw={best_position[1]:.0f}, "
      f"bf={best_position[2]:.0f}, tf={best_position[3]:.0f}")
```

---

## Summary

| Component | Location | Dependencies | Reusable? | Notes |
|-----------|----------|--------------|-----------|-------|
| **Intelligent PSO** | `optimization/intelligent_pso.py` | numpy | ✅ Yes | Best choice for web |
| **Global Best PSO** | `core/pso_optimizer.py` | numpy | ✅ Yes | Good for web |
| **Utils** | `core/utils.py` | None | ✅ Yes | Pure Python |
| **Visualizer** | `visualization/pso_visualizer.py` | PySide6, Matplotlib | ❌ No | Reimplement for web |
| **UI Manager** | `gui/pso_ui_manager.py` | PySide6 | ❌ No | Osdag-specific |

**Recommendation**: Extract `intelligent_pso.py` and `pso_optimizer.py` to `osdag-core/optimization/pso/` for reuse across projects.

