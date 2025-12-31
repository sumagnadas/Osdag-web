# Concurrency Scenarios - Multi-User & Multi-Tab Support

## Overview

This document analyzes how the Osdag web application handles concurrent design calculations for both **Optimized Design** (PSO with WebSockets) and **Normal Design** (REST API) types across multiple users and browser tabs.

---

## Table of Contents

1. [Optimized Design (PSO + WebSocket) Scenarios](#optimized-design-scenarios)
2. [Normal Design (REST API) Scenarios](#normal-design-scenarios)
3. [Architecture Comparison](#architecture-comparison)
4. [Potential Issues & Solutions](#potential-issues--solutions)
5. [Testing Recommendations](#testing-recommendations)

---

## Optimized Design Scenarios

### Scenario 1: Multiple Users, Different Modules (Optimized)

**Question**: Can User A design Plate Girder while User B designs Fin Plate simultaneously?

**Answer**: ✅ **YES - Fully Supported**

**How it works:**
- Each user gets a unique WebSocket connection
- Each connection has a unique channel name (e.g., `channel_name = self.channel_name`)
- Celery tasks are isolated per task ID
- Redis queues tasks independently

**Flow:**
```
User A (Plate Girder) → WebSocket A (channel: abc123) → Celery Task A → Worker 1
User B (Fin Plate)    → WebSocket B (channel: def456) → Celery Task B → Worker 2
User C (Beam Design)  → WebSocket C (channel: ghi789) → Celery Task C → Worker 3
```

**Implementation:**
```python
# Each WebSocket connection is automatically isolated
class PSOOptimizationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        # self.channel_name is unique per connection
        # e.g., "specific.abc123def456"
        await self.accept()
    
    async def receive_json(self, content):
        if content['type'] == 'start_optimization':
            # Pass unique channel name to Celery
            run_pso_optimization.delay(
                channel_name=self.channel_name,  # Unique per connection
                input_data=content['data']
            )
```

---

### Scenario 2: Same User, Multiple Tabs, Same Module, Different Inputs (Optimized)

**Question**: Can User A open two tabs, both designing Plate Girder with different inputs?

**Answer**: ✅ **YES - Fully Supported**

**How it works:**
- Each browser tab creates its own WebSocket connection
- Each connection gets a unique channel name
- Tasks are isolated by channel name
- Messages route to the correct tab

**Flow:**
```
Tab 1: Input A → WebSocket 1 (channel: abc123) → Task 1 → Updates Tab 1
Tab 2: Input B → WebSocket 2 (channel: def456) → Task 2 → Updates Tab 2
```

**Frontend Implementation:**
```javascript
// Each tab creates its own WebSocket connection
const useWebSocket = (url, callbacks) => {
  useEffect(() => {
    // Each tab gets its own WebSocket instance
    const ws = new WebSocket(url);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callbacks.onMessage?.(data); // Updates only this tab
    };
    
    return () => ws.close(); // Cleanup on tab close
  }, [url]);
};
```

---

### Scenario 3: Same User, Multiple Tabs, Different Modules (Optimized)

**Question**: Can User A design Plate Girder in Tab 1 and Fin Plate in Tab 2 simultaneously?

**Answer**: ✅ **YES - Fully Supported**

**How it works:**
- Each tab connects to its module-specific WebSocket route
- Each has its own unique channel name
- Tasks run independently in Celery workers

**Flow:**
```
Tab 1: Plate Girder → ws://.../plate-girder/ → Channel A → Task A
Tab 2: Fin Plate    → ws://.../fin-plate/   → Channel B → Task B
```

**WebSocket Routes:**
- `ws://localhost:8000/ws/optimize/plate-girder/` (Plate Girder)
- `ws://localhost:8000/ws/optimize/fin-plate/` (Fin Plate - if implemented)
- Each route has its own consumer instance

---

## Normal Design Scenarios

### Scenario 1: Multiple Users, Different Modules (Normal Design)

**Question**: Can User A design Fin Plate while User B designs Cleat Angle simultaneously using normal (non-optimized) design?

**Answer**: ✅ **YES - Fully Supported**

**How it works:**
- REST API is **stateless** - each request is independent
- Django handles concurrent requests via WSGI/ASGI workers
- No shared state between requests
- Database transactions are isolated

**Flow:**
```
User A: POST /api/modules/shear-connection/fin-plate/design/
        → Django View → Service.calculate() → Response A

User B: POST /api/modules/shear-connection/cleat-angle/design/
        → Django View → Service.calculate() → Response B
```

**Backend Implementation:**
```python
# backend/apps/modules/shear_connection/views.py
class ShearConnectionViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post'], url_path='(?P<submodule_slug>[^/.]+)/design')
    def design(self, request, submodule_slug=None):
        # Each request is independent
        # No shared state between requests
        inputs = request.data.get('inputs', {})
        result = ServiceClass.calculate(
            inputs=inputs,
            request=request,
            project_id=project_id,
            user_email=user_email
        )
        return Response(result, status=200)
```

**Concurrency Handling:**
- Django's WSGI/ASGI server (Gunicorn/Uvicorn) handles multiple requests
- Each request runs in its own thread/process
- Database connections are pooled and isolated
- **No blocking** - requests are processed independently

---

### Scenario 2: Same User, Multiple Tabs, Same Module, Different Inputs (Normal Design)

**Question**: Can User A open two tabs, both designing Fin Plate with different inputs using normal design?

**Answer**: ✅ **YES - Fully Supported**

**How it works:**
- Each tab makes independent HTTP POST requests
- No WebSocket connection needed
- Each request is stateless and isolated
- Responses are independent

**Flow:**
```
Tab 1: Input A → POST /api/modules/shear-connection/fin-plate/design/
        → Request 1 → Response 1 → Updates Tab 1

Tab 2: Input B → POST /api/modules/shear-connection/fin-plate/design/
        → Request 2 → Response 2 → Updates Tab 2
```

**Frontend Implementation:**
```javascript
// osdagclient/src/modules/shared/api/moduleApi.js
export const createDesign = async (param, module_id, onCADSuccess, dispatch) => {
  const slug = getSlug(module_id);
  const url = `${BASE_URL}api/modules/${slug}/design/`;
  
  // Each tab makes its own independent request
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: param }),
    credentials: "include"
  });
  
  const jsonResponse = await response?.json();
  
  // Response is isolated to this tab's dispatch
  if (dispatch) {
    dispatch({ type: "SET_DESIGN_DATA_AND_LOGS", payload: jsonResponse });
  }
  
  return { status: response.status, body: jsonResponse };
};
```

**Key Points:**
- ✅ No shared state between tabs
- ✅ Each request is independent
- ✅ Responses don't interfere with each other
- ✅ Frontend state is isolated per tab (React component state)

---

### Scenario 3: Same User, Multiple Tabs, Different Modules (Normal Design)

**Question**: Can User A design Fin Plate in Tab 1 and Cleat Angle in Tab 2 simultaneously using normal design?

**Answer**: ✅ **YES - Fully Supported**

**How it works:**
- Each tab makes requests to different endpoints
- Each request is stateless
- No interference between modules

**Flow:**
```
Tab 1: Fin Plate    → POST /api/modules/shear-connection/fin-plate/design/
        → Request 1 → Response 1

Tab 2: Cleat Angle  → POST /api/modules/shear-connection/cleat-angle/design/
        → Request 2 → Response 2
```

**Module Isolation:**
- Different URL endpoints per module
- Different service classes per module
- No shared state between modules

---

## Architecture Comparison

### Optimized Design (PSO + WebSocket)

| Aspect | Implementation | Concurrency Support |
|--------|---------------|---------------------|
| **Connection Type** | WebSocket (persistent) | ✅ Unique channel per connection |
| **Task Execution** | Celery workers (async) | ✅ Isolated worker processes |
| **Message Routing** | Channel Layer (Redis) | ✅ Channel-based routing |
| **State Management** | Per-connection state | ✅ Isolated per WebSocket |
| **Scalability** | Horizontal (multiple workers) | ✅ Excellent |

**Strengths:**
- Real-time updates
- Efficient for long-running tasks
- Scales horizontally with Celery workers

**Considerations:**
- Requires WebSocket infrastructure
- More complex setup (Celery + Channels + Redis)
- Connection management needed

---

### Normal Design (REST API)

| Aspect | Implementation | Concurrency Support |
|--------|---------------|---------------------|
| **Connection Type** | HTTP POST (stateless) | ✅ Independent requests |
| **Task Execution** | Django view (synchronous) | ✅ Thread/process per request |
| **Message Routing** | N/A (direct response) | ✅ N/A |
| **State Management** | Stateless | ✅ No shared state |
| **Scalability** | Vertical (WSGI workers) | ✅ Good (with proper workers) |

**Strengths:**
- Simple architecture
- Stateless (easy to scale)
- No special infrastructure needed
- Works with standard Django deployment

**Considerations:**
- Blocking for long calculations (unless async)
- No real-time progress updates
- Each request is independent (no streaming)

---

## Production-Critical Issues: "Silent Killers"

These issues won't break the code but will severely degrade user experience (laggy UI, stalled browser, blurry graphics). They must be addressed before production deployment.

### Issue 1: The "Firehose" Problem (Network Saturation)

**Problem**: Sending 50 particles × 10 variables × 8 bytes (double precision) × 10 frames per second creates massive JSON overhead. If optimization runs fast (e.g., 100 iterations in 2 seconds), Celery floods Redis, Redis floods WebSocket, and the frontend freezes trying to parse thousands of JSON messages arriving at once.

**Impact**: 
- Browser freezes during optimization
- High memory usage in frontend
- Network congestion
- Poor user experience

**Solution: Throttling & Time-Based Flushing**

Implement time-based throttling in the Celery task to limit update frequency:

```python
# backend/apps/modules/flexure_member/submodules/plate_girder/tasks.py
import time
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

@shared_task(bind=True)
def run_pso_optimization(self, channel_name, input_data):
    channel_layer = get_channel_layer()
    
    # Throttling configuration
    SEND_INTERVAL = 0.1  # Limit to 10 FPS (100ms between sends)
    MAX_ITERATIONS = 100
    last_sent_time = 0
    particle_buffer = []  # Buffer particles for batching
    
    def progress_callback(particle_data, iteration, is_global_best):
        nonlocal last_sent_time, particle_buffer
        
        current_time = time.time()
        particle_buffer.append({
            'data': particle_data,
            'iteration': iteration,
            'is_global_best': is_global_best
        })
        
        # Only send if enough time has passed OR it's the last iteration
        should_send = (
            (current_time - last_sent_time >= SEND_INTERVAL) or 
            (iteration == MAX_ITERATIONS) or
            is_global_best  # Always send global best updates
        )
        
        if should_send and particle_buffer:
            try:
                # Batch send all buffered particles
                async_to_sync(channel_layer.send)(
                    channel_name,
                    {
                        "type": "pso.update",
                        "data": {
                            "iteration": iteration,
                            "particles": [p['data'] for p in particle_buffer],
                            "is_global_best": is_global_best,
                            "timestamp": current_time
                        }
                    }
                )
                particle_buffer = []  # Clear buffer
                last_sent_time = current_time
            except Exception as e:
                # Log error but don't crash the optimization
                print(f"Error sending update: {e}")
    
    # Run optimization with throttled callback
    girder = PlateGirderWelded(input_data)
    best_solution = girder.optimized_method(callback=progress_callback)
    
    # Send final result
    async_to_sync(channel_layer.send)(
        channel_name,
        {
            "type": "pso.complete",
            "data": best_solution
        }
    )
```

**Frontend Throttling (Additional Safety)**:

```javascript
// osdagclient/src/modules/shared/components/PSODashboard/DataProcessor.js
class DataProcessor {
  constructor() {
    this.lastRenderTime = 0;
    this.RENDER_INTERVAL = 100; // 10 FPS max
    this.pendingUpdates = [];
  }
  
  addParticleData(data) {
    this.pendingUpdates.push(data);
    
    const now = Date.now();
    if (now - this.lastRenderTime >= this.RENDER_INTERVAL) {
      this.flushUpdates();
      this.lastRenderTime = now;
    }
  }
  
  flushUpdates() {
    if (this.pendingUpdates.length === 0) return;
    
    // Process all pending updates at once
    const updates = this.pendingUpdates.splice(0);
    this.processBatch(updates);
  }
}
```

---

### Issue 2: The "Stale Data" Problem (Race Conditions)

**Problem**: In real-world networks, WebSocket packets can arrive out of order or bunch up. You might receive Iteration 50 *after* Iteration 55, causing graphs to "jitter" back and forth or show incorrect data.

**Impact**:
- Graphs jump backward in time
- Confusing user experience
- Incorrect visualization state
- Potential state corruption

**Solution: Frontend Frame Dropping & Sequence Tracking**

Implement iteration-based frame dropping in the frontend:

```javascript
// osdagclient/src/modules/shared/components/PSODashboard/PSODashboard.jsx
import { useRef } from 'react';

export const PSODashboard = () => {
  // Track the highest iteration we've processed
  const currentIterationRef = useRef(-1);
  const lastUpdateTimeRef = useRef(0);
  
  const handleWebSocketMessage = (message) => {
    if (message.type === 'update') {
      const { iteration, particles, timestamp } = message.payload;
      
      // Drop stale frames (out-of-order packets)
      if (iteration < currentIterationRef.current) {
        console.warn(`Dropping stale frame: iteration ${iteration} < ${currentIterationRef.current}`);
        return;
      }
      
      // Update current iteration
      currentIterationRef.current = iteration;
      
      // Additional check: drop if timestamp is too old (optional)
      const now = Date.now();
      const messageAge = now - (timestamp * 1000); // Convert to ms
      if (messageAge > 5000) { // Drop messages older than 5 seconds
        console.warn(`Dropping old message: ${messageAge}ms old`);
        return;
      }
      
      // Process valid update
      updateVisualizations(particles, iteration);
    }
  };
  
  // ... rest of component
};
```

**Backend Sequence Numbers (Optional Enhancement)**:

```python
# Add sequence numbers to ensure ordering
sequence_counter = 0

def progress_callback(particle_data, iteration, is_global_best):
    nonlocal sequence_counter
    sequence_counter += 1
    
    async_to_sync(channel_layer.send)(
        channel_name,
        {
            "type": "pso.update",
            "data": {
                "sequence": sequence_counter,  # Monotonically increasing
                "iteration": iteration,
                "particles": particle_data,
                "is_global_best": is_global_best,
                "timestamp": time.time()
            }
        }
    )
```

---

### Issue 3: The "Canvas Blur" Problem (High DPI Screens)

**Problem**: On modern screens (Retina/High DPI), a standard `<canvas width="800">` looks blurry because the browser scales it up. The canvas internal resolution doesn't match the device pixel ratio.

**Impact**:
- Blurry, pixelated graphs on Retina displays
- Unprofessional appearance
- Poor readability
- User complaints about visual quality

**Solution: DPI-Aware Canvas Scaling**

Scale canvas internal resolution by device pixel ratio:

```javascript
// osdagclient/src/modules/shared/components/PSODashboard/ParallelCoordinates.jsx
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const ParallelCoordinates = ({ data, dimensions }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    
    // Get device pixel ratio (1 for normal, 2 for Retina, etc.)
    const dpr = window.devicePixelRatio || 1;
    
    // Get container dimensions
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Set actual size in memory (scaled up for high DPI)
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    // Scale all drawing operations automatically
    ctx.scale(dpr, dpr);
    
    // Set visible size (CSS size - not scaled)
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Now all drawing operations use the logical size (width x height)
    // but are rendered at high resolution (width*dpr x height*dpr)
    
    // Clear canvas with high DPI
    ctx.clearRect(0, 0, width, height);
    
    // Define scales
    const x = d3.scalePoint()
      .range([0, width])
      .padding(1)
      .domain(Object.keys(dimensions));
    
    // Draw lines (now crisp on high DPI)
    data.forEach(d => {
      ctx.beginPath();
      ctx.strokeStyle = d.is_feasible 
        ? 'rgba(0, 0, 255, 0.3)' 
        : 'rgba(255, 0, 0, 0.1)';
      ctx.lineWidth = 1; // Will be rendered at dpr resolution
      
      Object.keys(dimensions).forEach((dim, i) => {
        const xPos = x(dim);
        const yPos = dimensions[dim](d[dim]);
        if (i === 0) ctx.moveTo(xPos, yPos);
        else ctx.lineTo(xPos, yPos);
      });
      ctx.stroke();
    });
    
  }, [data, dimensions]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Re-render on resize
      const canvas = canvasRef.current;
      if (canvas) {
        // Trigger re-render by updating a dummy state or calling render
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <canvas 
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: '100%',
          display: 'block' // Remove default inline spacing
        }}
      />
    </div>
  );
};

export default ParallelCoordinates;
```

**Reusable Canvas Hook**:

```javascript
// osdagclient/src/modules/shared/hooks/useHighDPICanvas.js
import { useRef, useEffect } from 'react';

export const useHighDPICanvas = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const contextRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Set high DPI resolution
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    contextRef.current = ctx;
    
    // Set CSS size
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Return cleanup
    return () => {
      contextRef.current = null;
    };
  }, []);
  
  return {
    canvasRef,
    containerRef,
    context: contextRef.current,
    getContext: () => contextRef.current
  };
};
```

---

### Issue 4: Docker/Deployment Gotcha (Redis Connection Loss)

**Problem**: In production (Docker), Redis often runs in a separate container. If the Celery worker loses connection to Redis, the user sees a "Connecting..." spinner forever because the task silently fails to send updates. The optimization may complete, but the user never knows.

**Impact**:
- Users see infinite "Connecting..." state
- No error feedback
- Silent task failures
- Poor user experience

**Solution: Error Handling & Heartbeat/Keep-Alive**

Add robust error handling and connection monitoring:

```python
# backend/apps/modules/flexure_member/submodules/plate_girder/tasks.py
import time
import logging
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from celery.exceptions import Retry

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def run_pso_optimization(self, channel_name, input_data):
    channel_layer = get_channel_layer()
    last_heartbeat = time.time()
    HEARTBEAT_INTERVAL = 2.0  # Send heartbeat every 2 seconds
    connection_errors = 0
    MAX_CONNECTION_ERRORS = 5
    
    def progress_callback(particle_data, iteration, is_global_best):
        nonlocal last_heartbeat, connection_errors
        
        current_time = time.time()
        
        # Send heartbeat if too much time has passed
        if current_time - last_heartbeat > HEARTBEAT_INTERVAL:
            try:
                async_to_sync(channel_layer.send)(
                    channel_name,
                    {
                        "type": "pso.heartbeat",
                        "data": {
                            "iteration": iteration,
                            "timestamp": current_time
                        }
                    }
                )
                last_heartbeat = current_time
                connection_errors = 0  # Reset error counter on success
            except Exception as e:
                connection_errors += 1
                logger.error(f"Channel layer error (attempt {connection_errors}): {e}")
                
                # If too many errors, abort the task
                if connection_errors >= MAX_CONNECTION_ERRORS:
                    logger.critical(f"Too many connection errors. Aborting task.")
                    # Send error message to user
                    try:
                        async_to_sync(channel_layer.send)(
                            channel_name,
                            {
                                "type": "pso.error",
                                "data": {
                                    "error": "Connection to server lost. Please try again.",
                                    "iteration": iteration
                                }
                            }
                        )
                    except:
                        pass  # Can't even send error message
                    raise Exception("Redis connection lost")
        
        # Regular progress update (with error handling)
        try:
            async_to_sync(channel_layer.send)(
                channel_name,
                {
                    "type": "pso.update",
                    "data": {
                        "iteration": iteration,
                        "particles": particle_data,
                        "is_global_best": is_global_best,
                        "timestamp": current_time
                    }
                }
            )
        except Exception as e:
            logger.error(f"Error sending progress update: {e}")
            connection_errors += 1
            if connection_errors >= MAX_CONNECTION_ERRORS:
                raise
    
    try:
        # Run optimization
        girder = PlateGirderWelded(input_data)
        best_solution = girder.optimized_method(callback=progress_callback)
        
        # Send completion (with retry)
        try:
            async_to_sync(channel_layer.send)(
                channel_name,
                {
                    "type": "pso.complete",
                    "data": best_solution
                }
            )
        except Exception as e:
            logger.error(f"Error sending completion: {e}")
            # Retry the entire task
            raise self.retry(exc=e, countdown=5)
            
    except Exception as e:
        logger.error(f"Optimization task failed: {e}")
        # Send error to user
        try:
            async_to_sync(channel_layer.send)(
                channel_name,
                {
                    "type": "pso.error",
                    "data": {
                        "error": str(e),
                        "message": "Optimization failed. Please check inputs and try again."
                    }
                }
            )
        except:
            pass
        raise
```

**Frontend Error Handling**:

```javascript
// osdagclient/src/modules/shared/hooks/useWebSocket.js
export const useWebSocket = (url, callbacks) => {
  const wsRef = useRef(null);
  const heartbeatTimeoutRef = useRef(null);
  const lastHeartbeatRef = useRef(Date.now());
  const RECONNECT_DELAY = 3000;
  const HEARTBEAT_TIMEOUT = 10000; // 10 seconds without heartbeat = dead connection
  
  const checkHeartbeat = () => {
    const timeSinceLastHeartbeat = Date.now() - lastHeartbeatRef.current;
    if (timeSinceLastHeartbeat > HEARTBEAT_TIMEOUT) {
      console.warn('WebSocket heartbeat timeout. Reconnecting...');
      reconnect();
    }
  };
  
  const reconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setTimeout(() => {
      connect();
    }, RECONNECT_DELAY);
  };
  
  const connect = () => {
    wsRef.current = new WebSocket(url);
    
    wsRef.current.onopen = () => {
      lastHeartbeatRef.current = Date.now();
      callbacks.onConnect?.();
    };
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Handle heartbeat
      if (data.type === 'heartbeat') {
        lastHeartbeatRef.current = Date.now();
        return;
      }
      
      // Handle errors
      if (data.type === 'error') {
        callbacks.onError?.(new Error(data.payload.error || data.payload.message));
        return;
      }
      
      callbacks.onMessage?.(data);
    };
    
    wsRef.current.onerror = (error) => {
      callbacks.onError?.(error);
    };
    
    wsRef.current.onclose = () => {
      callbacks.onDisconnect?.();
      // Attempt to reconnect
      reconnect();
    };
    
    // Check heartbeat periodically
    heartbeatTimeoutRef.current = setInterval(checkHeartbeat, 5000);
  };
  
  useEffect(() => {
    connect();
    return () => {
      if (heartbeatTimeoutRef.current) {
        clearInterval(heartbeatTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url]);
  
  return {
    send: (data) => wsRef.current?.send(JSON.stringify(data)),
    disconnect: () => {
      if (heartbeatTimeoutRef.current) {
        clearInterval(heartbeatTimeoutRef.current);
      }
      wsRef.current?.close();
    },
    isConnected: wsRef.current?.readyState === WebSocket.OPEN
  };
};
```

**Docker Compose Health Checks**:

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
  
  celery-worker:
    depends_on:
      redis:
        condition: service_healthy
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
```

---

## Production-Critical Issues: "Silent Killers"

These issues won't break the code but will severely degrade user experience (laggy UI, stalled browser, blurry graphics). They must be addressed before production deployment.

### Issue 1: The "Firehose" Problem (Network Saturation)

**Problem**: Sending 50 particles × 10 variables × 8 bytes (double precision) × 10 frames per second creates massive JSON overhead. If optimization runs fast (e.g., 100 iterations in 2 seconds), Celery floods Redis, Redis floods WebSocket, and the frontend freezes trying to parse thousands of JSON messages arriving at once.

**Impact**: 
- Browser freezes during optimization
- High memory usage in frontend
- Network congestion
- Poor user experience

**Solution: Throttling & Time-Based Flushing**

Implement time-based throttling in the Celery task to limit update frequency:

```python
# backend/apps/modules/flexure_member/submodules/plate_girder/tasks.py
import time
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

@shared_task(bind=True)
def run_pso_optimization(self, channel_name, input_data):
    channel_layer = get_channel_layer()
    
    # Throttling configuration
    SEND_INTERVAL = 0.1  # Limit to 10 FPS (100ms between sends)
    MAX_ITERATIONS = 100
    last_sent_time = 0
    particle_buffer = []  # Buffer particles for batching
    
    def progress_callback(particle_data, iteration, is_global_best):
        nonlocal last_sent_time, particle_buffer
        
        current_time = time.time()
        particle_buffer.append({
            'data': particle_data,
            'iteration': iteration,
            'is_global_best': is_global_best
        })
        
        # Only send if enough time has passed OR it's the last iteration
        should_send = (
            (current_time - last_sent_time >= SEND_INTERVAL) or 
            (iteration == MAX_ITERATIONS) or
            is_global_best  # Always send global best updates
        )
        
        if should_send and particle_buffer:
            try:
                # Batch send all buffered particles
                async_to_sync(channel_layer.send)(
                    channel_name,
                    {
                        "type": "pso.update",
                        "data": {
                            "iteration": iteration,
                            "particles": [p['data'] for p in particle_buffer],
                            "is_global_best": is_global_best,
                            "timestamp": current_time
                        }
                    }
                )
                particle_buffer = []  # Clear buffer
                last_sent_time = current_time
            except Exception as e:
                # Log error but don't crash the optimization
                print(f"Error sending update: {e}")
    
    # Run optimization with throttled callback
    girder = PlateGirderWelded(input_data)
    best_solution = girder.optimized_method(callback=progress_callback)
    
    # Send final result
    async_to_sync(channel_layer.send)(
        channel_name,
        {
            "type": "pso.complete",
            "data": best_solution
        }
    )
```

**Frontend Throttling (Additional Safety)**:

```javascript
// osdagclient/src/modules/shared/components/PSODashboard/DataProcessor.js
class DataProcessor {
  constructor() {
    this.lastRenderTime = 0;
    this.RENDER_INTERVAL = 100; // 10 FPS max
    this.pendingUpdates = [];
  }
  
  addParticleData(data) {
    this.pendingUpdates.push(data);
    
    const now = Date.now();
    if (now - this.lastRenderTime >= this.RENDER_INTERVAL) {
      this.flushUpdates();
      this.lastRenderTime = now;
    }
  }
  
  flushUpdates() {
    if (this.pendingUpdates.length === 0) return;
    
    // Process all pending updates at once
    const updates = this.pendingUpdates.splice(0);
    this.processBatch(updates);
  }
}
```

---

### Issue 2: The "Stale Data" Problem (Race Conditions)

**Problem**: In real-world networks, WebSocket packets can arrive out of order or bunch up. You might receive Iteration 50 *after* Iteration 55, causing graphs to "jitter" back and forth or show incorrect data.

**Impact**:
- Graphs jump backward in time
- Confusing user experience
- Incorrect visualization state
- Potential state corruption

**Solution: Frontend Frame Dropping & Sequence Tracking**

Implement iteration-based frame dropping in the frontend:

```javascript
// osdagclient/src/modules/shared/components/PSODashboard/PSODashboard.jsx
import { useRef } from 'react';

export const PSODashboard = () => {
  // Track the highest iteration we've processed
  const currentIterationRef = useRef(-1);
  const lastUpdateTimeRef = useRef(0);
  
  const handleWebSocketMessage = (message) => {
    if (message.type === 'update') {
      const { iteration, particles, timestamp } = message.payload;
      
      // Drop stale frames (out-of-order packets)
      if (iteration < currentIterationRef.current) {
        console.warn(`Dropping stale frame: iteration ${iteration} < ${currentIterationRef.current}`);
        return;
      }
      
      // Update current iteration
      currentIterationRef.current = iteration;
      
      // Additional check: drop if timestamp is too old (optional)
      const now = Date.now();
      const messageAge = now - (timestamp * 1000); // Convert to ms
      if (messageAge > 5000) { // Drop messages older than 5 seconds
        console.warn(`Dropping old message: ${messageAge}ms old`);
        return;
      }
      
      // Process valid update
      updateVisualizations(particles, iteration);
    }
  };
  
  // ... rest of component
};
```

**Backend Sequence Numbers (Optional Enhancement)**:

```python
# Add sequence numbers to ensure ordering
sequence_counter = 0

def progress_callback(particle_data, iteration, is_global_best):
    nonlocal sequence_counter
    sequence_counter += 1
    
    async_to_sync(channel_layer.send)(
        channel_name,
        {
            "type": "pso.update",
            "data": {
                "sequence": sequence_counter,  # Monotonically increasing
                "iteration": iteration,
                "particles": particle_data,
                "is_global_best": is_global_best,
                "timestamp": time.time()
            }
        }
    )
```

---

### Issue 3: The "Canvas Blur" Problem (High DPI Screens)

**Problem**: On modern screens (Retina/High DPI), a standard `<canvas width="800">` looks blurry because the browser scales it up. The canvas internal resolution doesn't match the device pixel ratio.

**Impact**:
- Blurry, pixelated graphs on Retina displays
- Unprofessional appearance
- Poor readability
- User complaints about visual quality

**Solution: DPI-Aware Canvas Scaling**

Scale canvas internal resolution by device pixel ratio:

```javascript
// osdagclient/src/modules/shared/components/PSODashboard/ParallelCoordinates.jsx
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const ParallelCoordinates = ({ data, dimensions }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    
    // Get device pixel ratio (1 for normal, 2 for Retina, etc.)
    const dpr = window.devicePixelRatio || 1;
    
    // Get container dimensions
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Set actual size in memory (scaled up for high DPI)
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    // Scale all drawing operations automatically
    ctx.scale(dpr, dpr);
    
    // Set visible size (CSS size - not scaled)
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Now all drawing operations use the logical size (width x height)
    // but are rendered at high resolution (width*dpr x height*dpr)
    
    // Clear canvas with high DPI
    ctx.clearRect(0, 0, width, height);
    
    // Define scales
    const x = d3.scalePoint()
      .range([0, width])
      .padding(1)
      .domain(Object.keys(dimensions));
    
    // Draw lines (now crisp on high DPI)
    data.forEach(d => {
      ctx.beginPath();
      ctx.strokeStyle = d.is_feasible 
        ? 'rgba(0, 0, 255, 0.3)' 
        : 'rgba(255, 0, 0, 0.1)';
      ctx.lineWidth = 1; // Will be rendered at dpr resolution
      
      Object.keys(dimensions).forEach((dim, i) => {
        const xPos = x(dim);
        const yPos = dimensions[dim](d[dim]);
        if (i === 0) ctx.moveTo(xPos, yPos);
        else ctx.lineTo(xPos, yPos);
      });
      ctx.stroke();
    });
    
  }, [data, dimensions]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Re-render on resize
      const canvas = canvasRef.current;
      if (canvas) {
        // Trigger re-render by updating a dummy state or calling render
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <canvas 
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: '100%',
          display: 'block' // Remove default inline spacing
        }}
      />
    </div>
  );
};

export default ParallelCoordinates;
```

**Reusable Canvas Hook**:

```javascript
// osdagclient/src/modules/shared/hooks/useHighDPICanvas.js
import { useRef, useEffect } from 'react';

export const useHighDPICanvas = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const contextRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Set high DPI resolution
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    contextRef.current = ctx;
    
    // Set CSS size
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Return cleanup
    return () => {
      contextRef.current = null;
    };
  }, []);
  
  return {
    canvasRef,
    containerRef,
    context: contextRef.current,
    getContext: () => contextRef.current
  };
};
```

---

### Issue 4: Docker/Deployment Gotcha (Redis Connection Loss)

**Problem**: In production (Docker), Redis often runs in a separate container. If the Celery worker loses connection to Redis, the user sees a "Connecting..." spinner forever because the task silently fails to send updates. The optimization may complete, but the user never knows.

**Impact**:
- Users see infinite "Connecting..." state
- No error feedback
- Silent task failures
- Poor user experience

**Solution: Error Handling & Heartbeat/Keep-Alive**

Add robust error handling and connection monitoring:

```python
# backend/apps/modules/flexure_member/submodules/plate_girder/tasks.py
import time
import logging
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from celery.exceptions import Retry

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def run_pso_optimization(self, channel_name, input_data):
    channel_layer = get_channel_layer()
    last_heartbeat = time.time()
    HEARTBEAT_INTERVAL = 2.0  # Send heartbeat every 2 seconds
    connection_errors = 0
    MAX_CONNECTION_ERRORS = 5
    
    def progress_callback(particle_data, iteration, is_global_best):
        nonlocal last_heartbeat, connection_errors
        
        current_time = time.time()
        
        # Send heartbeat if too much time has passed
        if current_time - last_heartbeat > HEARTBEAT_INTERVAL:
            try:
                async_to_sync(channel_layer.send)(
                    channel_name,
                    {
                        "type": "pso.heartbeat",
                        "data": {
                            "iteration": iteration,
                            "timestamp": current_time
                        }
                    }
                )
                last_heartbeat = current_time
                connection_errors = 0  # Reset error counter on success
            except Exception as e:
                connection_errors += 1
                logger.error(f"Channel layer error (attempt {connection_errors}): {e}")
                
                # If too many errors, abort the task
                if connection_errors >= MAX_CONNECTION_ERRORS:
                    logger.critical(f"Too many connection errors. Aborting task.")
                    # Send error message to user
                    try:
                        async_to_sync(channel_layer.send)(
                            channel_name,
                            {
                                "type": "pso.error",
                                "data": {
                                    "error": "Connection to server lost. Please try again.",
                                    "iteration": iteration
                                }
                            }
                        )
                    except:
                        pass  # Can't even send error message
                    raise Exception("Redis connection lost")
        
        # Regular progress update (with error handling)
        try:
            async_to_sync(channel_layer.send)(
                channel_name,
                {
                    "type": "pso.update",
                    "data": {
                        "iteration": iteration,
                        "particles": particle_data,
                        "is_global_best": is_global_best,
                        "timestamp": current_time
                    }
                }
            )
        except Exception as e:
            logger.error(f"Error sending progress update: {e}")
            connection_errors += 1
            if connection_errors >= MAX_CONNECTION_ERRORS:
                raise
    
    try:
        # Run optimization
        girder = PlateGirderWelded(input_data)
        best_solution = girder.optimized_method(callback=progress_callback)
        
        # Send completion (with retry)
        try:
            async_to_sync(channel_layer.send)(
                channel_name,
                {
                    "type": "pso.complete",
                    "data": best_solution
                }
            )
        except Exception as e:
            logger.error(f"Error sending completion: {e}")
            # Retry the entire task
            raise self.retry(exc=e, countdown=5)
            
    except Exception as e:
        logger.error(f"Optimization task failed: {e}")
        # Send error to user
        try:
            async_to_sync(channel_layer.send)(
                channel_name,
                {
                    "type": "pso.error",
                    "data": {
                        "error": str(e),
                        "message": "Optimization failed. Please check inputs and try again."
                    }
                }
            )
        except:
            pass
        raise
```

**Frontend Error Handling**:

```javascript
// osdagclient/src/modules/shared/hooks/useWebSocket.js
export const useWebSocket = (url, callbacks) => {
  const wsRef = useRef(null);
  const heartbeatTimeoutRef = useRef(null);
  const lastHeartbeatRef = useRef(Date.now());
  const RECONNECT_DELAY = 3000;
  const HEARTBEAT_TIMEOUT = 10000; // 10 seconds without heartbeat = dead connection
  
  const checkHeartbeat = () => {
    const timeSinceLastHeartbeat = Date.now() - lastHeartbeatRef.current;
    if (timeSinceLastHeartbeat > HEARTBEAT_TIMEOUT) {
      console.warn('WebSocket heartbeat timeout. Reconnecting...');
      reconnect();
    }
  };
  
  const reconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setTimeout(() => {
      connect();
    }, RECONNECT_DELAY);
  };
  
  const connect = () => {
    wsRef.current = new WebSocket(url);
    
    wsRef.current.onopen = () => {
      lastHeartbeatRef.current = Date.now();
      callbacks.onConnect?.();
    };
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Handle heartbeat
      if (data.type === 'heartbeat') {
        lastHeartbeatRef.current = Date.now();
        return;
      }
      
      // Handle errors
      if (data.type === 'error') {
        callbacks.onError?.(new Error(data.payload.error || data.payload.message));
        return;
      }
      
      callbacks.onMessage?.(data);
    };
    
    wsRef.current.onerror = (error) => {
      callbacks.onError?.(error);
    };
    
    wsRef.current.onclose = () => {
      callbacks.onDisconnect?.();
      // Attempt to reconnect
      reconnect();
    };
    
    // Check heartbeat periodically
    heartbeatTimeoutRef.current = setInterval(checkHeartbeat, 5000);
  };
  
  useEffect(() => {
    connect();
    return () => {
      if (heartbeatTimeoutRef.current) {
        clearInterval(heartbeatTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url]);
  
  return {
    send: (data) => wsRef.current?.send(JSON.stringify(data)),
    disconnect: () => {
      if (heartbeatTimeoutRef.current) {
        clearInterval(heartbeatTimeoutRef.current);
      }
      wsRef.current?.close();
    },
    isConnected: wsRef.current?.readyState === WebSocket.OPEN
  };
};
```

**Docker Compose Health Checks**:

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
  
  celery-worker:
    depends_on:
      redis:
        condition: service_healthy
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
```

---

## Potential Issues & Solutions

### Issue 1: Database Connection Pool Exhaustion

**Problem**: Too many concurrent requests might exhaust database connection pool.

**Solution:**
```python
# backend/config/settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'CONN_MAX_AGE': 600,  # Reuse connections
        'OPTIONS': {
            'connect_timeout': 10,
        },
    }
}

# Configure connection pool size
# PostgreSQL: max_connections in postgresql.conf
# Django: CONN_MAX_AGE for connection reuse
```

**For Normal Design:**
- Use connection pooling (default in Django)
- Configure PostgreSQL `max_connections` appropriately
- Use `CONN_MAX_AGE` to reuse connections

**For Optimized Design:**
- Celery workers have their own connection pools
- Django WebSocket consumers use separate connections
- Monitor connection usage

---

### Issue 2: Memory Usage (Normal Design)

**Problem**: Multiple concurrent calculations might use excessive memory.

**Solution:**
```python
# Limit concurrent calculations per user (optional)
from django.core.cache import cache

def check_user_concurrent_limit(user_email, max_concurrent=3):
    key = f"concurrent_designs:{user_email}"
    current = cache.get(key, 0)
    if current >= max_concurrent:
        raise Exception("Too many concurrent designs")
    cache.set(key, current + 1, timeout=300)  # 5 min expiry
```

**For Normal Design:**
- Each request uses memory independently
- Memory is freed after request completes
- Use WSGI workers with process limits

**For Optimized Design:**
- Celery workers have memory limits
- Monitor worker memory usage
- Use `celery worker --max-memory-per-child` to restart workers

---

### Issue 3: CPU Blocking (Normal Design)

**Problem**: Long-running calculations block Django workers.

**Solution:**
```python
# Option 1: Use async views (Django 3.1+)
from django.views.decorators.http import require_http_methods
from asgiref.sync import sync_to_async

@require_http_methods(["POST"])
async def design_async(request):
    result = await sync_to_async(ServiceClass.calculate)(inputs)
    return JsonResponse(result)

# Option 2: Use Celery for normal design too (if needed)
@shared_task
def calculate_design_async(inputs, user_email):
    return ServiceClass.calculate(inputs)
```

**Current Implementation:**
- Normal design runs synchronously in Django views
- For short calculations (< 5 seconds): ✅ Works fine
- For long calculations (> 10 seconds): ⚠️ Consider Celery

**Recommendation:**
- Keep normal design synchronous for now (most calculations are fast)
- Monitor response times
- Move to Celery if calculations become too slow

---

### Issue 4: WebSocket Connection Limits

**Problem**: Too many WebSocket connections might overwhelm server.

**Solution:**
```python
# Limit connections per user (optional)
from channels.layers import get_channel_layer

class PSOOptimizationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user_email = self.scope.get('user', {}).get('email', 'guest')
        connection_count = await self.get_user_connection_count(user_email)
        
        if connection_count >= 5:  # Max 5 concurrent connections
            await self.close(code=4001)  # Custom close code
            return
        
        await self.accept()
```

**For Optimized Design:**
- Use WebSocket proxy (Nginx) for connection management
- Implement connection limits per user
- Monitor active connections

---

### Issue 5: Frontend State Isolation

**Problem**: Multiple tabs might share state if not properly isolated.

**Solution:**
```javascript
// Each tab has its own React component instance
// State is isolated per component mount

// osdagclient/src/modules/shared/components/EngineeringModule.jsx
export const EngineeringModule = ({ moduleConfig }) => {
  // Each tab gets its own state
  const [inputs, setInputs] = useState({});
  const [output, setOutput] = useState({});
  const [loading, setLoading] = useState(false);
  
  // State is automatically isolated per component instance
  // No shared state between tabs
};
```

**For Both Design Types:**
- ✅ React component state is isolated per tab
- ✅ Each tab has its own component instance
- ✅ No shared global state (unless using Context with proper isolation)

---

## Testing Recommendations

### Test Case 1: Multiple Users, Different Modules

**Test Steps:**
1. User A: Open Plate Girder (Optimized) → Start optimization
2. User B: Open Fin Plate (Normal) → Submit design
3. User C: Open Cleat Angle (Normal) → Submit design
4. Verify all complete successfully

**Expected Result:**
- ✅ All designs complete independently
- ✅ No interference between users
- ✅ Responses are correct for each user

---

### Test Case 2: Same User, Multiple Tabs, Same Module

**Test Steps:**
1. Tab 1: Open Plate Girder (Optimized) → Input A → Start
2. Tab 2: Open Plate Girder (Optimized) → Input B → Start
3. Verify both tabs receive correct updates

**Expected Result:**
- ✅ Each tab receives updates for its own optimization
- ✅ No cross-tab interference
- ✅ WebSocket messages route correctly

---

### Test Case 3: Same User, Multiple Tabs, Normal Design

**Test Steps:**
1. Tab 1: Open Fin Plate (Normal) → Input A → Submit
2. Tab 2: Open Fin Plate (Normal) → Input B → Submit
3. Verify both tabs show correct results

**Expected Result:**
- ✅ Each tab shows its own results
- ✅ No state sharing between tabs
- ✅ Responses are independent

---

### Test Case 4: Stress Test - 10 Concurrent Users

**Test Steps:**
1. 10 users simultaneously submit designs (mix of optimized and normal)
2. Monitor server resources (CPU, memory, connections)
3. Verify all complete successfully

**Expected Result:**
- ✅ All requests complete
- ✅ No timeouts or errors
- ✅ Server resources within limits

**Tools:**
```bash
# Use Apache Bench or similar
ab -n 100 -c 10 -p design.json -T application/json \
   http://localhost:8000/api/modules/shear-connection/fin-plate/design/
```

---

## Summary

### Optimized Design (PSO + WebSocket)

| Scenario | Supported | Notes |
|----------|-----------|-------|
| Multiple users, different modules | ✅ Yes | Unique WebSocket channels |
| Same user, multiple tabs, same module | ✅ Yes | Unique channel per tab |
| Same user, multiple tabs, different modules | ✅ Yes | Different WebSocket routes |

**Architecture:**
- Celery workers handle task execution
- Channel Layer routes messages correctly
- Each WebSocket connection is isolated

---

### Normal Design (REST API)

| Scenario | Supported | Notes |
|----------|-----------|-------|
| Multiple users, different modules | ✅ Yes | Stateless HTTP requests |
| Same user, multiple tabs, same module | ✅ Yes | Independent requests |
| Same user, multiple tabs, different modules | ✅ Yes | Different endpoints |

**Architecture:**
- Stateless REST API
- Each request is independent
- No shared state between requests

---

## Conclusion

**Both design types fully support all concurrency scenarios:**

1. ✅ **Multiple users, different modules** - Works for both
2. ✅ **Same user, multiple tabs, same module** - Works for both
3. ✅ **Same user, multiple tabs, different modules** - Works for both

**Key Differences:**
- **Optimized Design**: Uses WebSocket + Celery (more complex, real-time updates)
- **Normal Design**: Uses REST API (simpler, stateless)

**Critical Production Requirements:**

Before deploying to production, **MUST implement**:

1. ✅ **Throttling & Time-Based Flushing** (Issue 1) - Prevents network saturation
2. ✅ **Frame Dropping & Sequence Tracking** (Issue 2) - Prevents stale data
3. ✅ **DPI-Aware Canvas Scaling** (Issue 3) - Prevents blurry graphics
4. ✅ **Error Handling & Heartbeat** (Issue 4) - Prevents silent failures

**Recommendations:**
- Monitor database connection pool for high concurrency
- Consider Celery for normal design if calculations become slow
- Implement connection limits for WebSocket if needed
- Use proper WSGI/ASGI worker configuration for normal design
- **Test all 4 "Silent Killers" in staging environment before production**
- Monitor WebSocket message rates and drop rates
- Set up alerts for Redis connection failures
- Test on high DPI displays (Retina, 4K monitors)

---

## References

- [Django Channels Documentation](https://channels.readthedocs.io/)
- [Celery Documentation](https://docs.celeryproject.org/)
- [Django Concurrency Best Practices](https://docs.djangoproject.com/en/stable/topics/async/)
- [WebSocket Scaling Guide](https://channels.readthedocs.io/en/stable/topics/channel_layers.html#scaling)

