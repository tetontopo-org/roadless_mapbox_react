import type mapboxgl from "mapbox-gl";

interface FlightControls {
  isActive: boolean;
  speed: number;
  altitude: number;
  pitch: number;
  bearing: number;
}

export class FlightControl implements mapboxgl.IControl {
  private _container!: HTMLElement;
  private _map!: mapboxgl.Map;
  private _isActive: boolean = false;
  private _animationId: number | null = null;
  private _keys: Set<string> = new Set();
  private _flightControls: FlightControls = {
    isActive: false,
    speed: 0.5, // degrees per frame
    altitude: 0.1, // zoom change per frame
    pitch: 1, // degrees per frame
    bearing: 2, // degrees per frame
  };

  // Key mappings
  private _keyMappings = {
    // Movement
    'KeyW': 'forward',
    'KeyS': 'backward', 
    'KeyA': 'left',
    'KeyD': 'right',
    'KeyQ': 'up',
    'KeyE': 'down',
    
    // Rotation
    'ArrowUp': 'pitchUp',
    'ArrowDown': 'pitchDown',
    'ArrowLeft': 'bearingLeft',
    'ArrowRight': 'bearingRight',
    
    // Speed control
    'KeyZ': 'speedDown',
    'KeyX': 'speedUp',
    
    // Toggle
    'Space': 'toggle',
    'Escape': 'stop',
  };

  onAdd(map: mapboxgl.Map): HTMLElement {
    this._map = map;

    const container = document.createElement("div");
    container.className = "mapboxgl-ctrl flight-control";
    container.innerHTML = `
      <div class="flight-control-panel">
        <button class="flight-toggle-btn" type="button" title="Toggle Flight Mode (Space)">
          <span class="flight-icon">✈</span>
        </button>
        <div class="flight-controls ${this._isActive ? 'active' : ''}">
          <div class="flight-info">
            <div class="flight-status">Flight Mode: <span class="status-text">OFF</span></div>
            <div class="flight-speed">Speed: <span class="speed-value">${this._flightControls.speed.toFixed(1)}</span></div>
          </div>
          <div class="flight-help">
            <div class="help-title">Controls:</div>
            <div class="help-keys">
              <div class="help-row">
                <span class="key">WASD</span> <span class="action">Move</span>
                <span class="key">QE</span> <span class="action">Up/Down</span>
              </div>
              <div class="help-row">
                <span class="key">Arrows</span> <span class="action">Rotate</span>
                <span class="key">ZX</span> <span class="action">Speed</span>
              </div>
              <div class="help-row">
                <span class="key">Space</span> <span class="action">Toggle</span>
                <span class="key">Esc</span> <span class="action">Stop</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Get references to elements
    const toggleBtn = container.querySelector('.flight-toggle-btn') as HTMLButtonElement;
    const statusText = container.querySelector('.status-text') as HTMLElement;
    const speedValue = container.querySelector('.speed-value') as HTMLElement;

    // Toggle button click handler
    toggleBtn.addEventListener('click', () => {
      this.toggleFlightMode();
    });

    // Store references for updates
    this._statusText = statusText;
    this._speedValue = speedValue;

    // Add keyboard event listeners
    this._setupKeyboardListeners();

    this._container = container;
    return container;
  }

  private _statusText!: HTMLElement;
  private _speedValue!: HTMLElement;

  onRemove(): void {
    this._removeKeyboardListeners();
    this._stopAnimation();
    this._container.remove();
  }

  getDefaultPosition() {
    return "top-left" as const;
  }

  private _setupKeyboardListeners(): void {
    document.addEventListener('keydown', this._onKeyDown.bind(this));
    document.addEventListener('keyup', this._onKeyUp.bind(this));
  }

  private _removeKeyboardListeners(): void {
    document.removeEventListener('keydown', this._onKeyDown.bind(this));
    document.removeEventListener('keyup', this._onKeyUp.bind(this));
  }

  private _onKeyDown(event: KeyboardEvent): void {
    // Prevent default for our keys
    if (Object.keys(this._keyMappings).includes(event.code)) {
      event.preventDefault();
    }

    const action = this._keyMappings[event.code as keyof typeof this._keyMappings];
    if (action && !this._keys.has(event.code)) {
      this._keys.add(event.code);
      this._handleKeyAction(action, true);
    }
  }

  private _onKeyUp(event: KeyboardEvent): void {
    const action = this._keyMappings[event.code as keyof typeof this._keyMappings];
    if (action) {
      this._keys.delete(event.code);
      this._handleKeyAction(action, false);
    }
  }

  private _handleKeyAction(action: string, isPressed: boolean): void {
    if (action === 'toggle' && isPressed) {
      this.toggleFlightMode();
    } else if (action === 'stop' && isPressed) {
      this.stopFlightMode();
    } else if (this._isActive && isPressed) {
      this._handleMovement(action);
    }
  }

  private _handleMovement(action: string): void {
    const center = this._map.getCenter();
    const zoom = this._map.getZoom();
    const pitch = this._map.getPitch();
    const bearing = this._map.getBearing();

    let newCenter = center;
    let newZoom = zoom;
    let newPitch = pitch;
    let newBearing = bearing;

    const speed = this._flightControls.speed;
    const altitude = this._flightControls.altitude;
    const pitchSpeed = this._flightControls.pitch;
    const bearingSpeed = this._flightControls.bearing;

    // Convert degrees to radians for calculations
    const bearingRad = (bearing * Math.PI) / 180;

    switch (action) {
      case 'forward':
        const forwardLng = center.lng + (speed * Math.sin(bearingRad)) / Math.cos((center.lat * Math.PI) / 180);
        const forwardLat = center.lat + (speed * Math.cos(bearingRad));
        newCenter = new mapboxgl.LngLat(forwardLng, forwardLat);
        break;
      
      case 'backward':
        const backwardLng = center.lng - (speed * Math.sin(bearingRad)) / Math.cos((center.lat * Math.PI) / 180);
        const backwardLat = center.lat - (speed * Math.cos(bearingRad));
        newCenter = new mapboxgl.LngLat(backwardLng, backwardLat);
        break;
      
      case 'left':
        const leftLng = center.lng - (speed * Math.cos(bearingRad)) / Math.cos((center.lat * Math.PI) / 180);
        const leftLat = center.lat + (speed * Math.sin(bearingRad));
        newCenter = new mapboxgl.LngLat(leftLng, leftLat);
        break;
      
      case 'right':
        const rightLng = center.lng + (speed * Math.cos(bearingRad)) / Math.cos((center.lat * Math.PI) / 180);
        const rightLat = center.lat - (speed * Math.sin(bearingRad));
        newCenter = new mapboxgl.LngLat(rightLng, rightLat);
        break;
      
      case 'up':
        newZoom = Math.min(zoom + altitude, 22);
        break;
      
      case 'down':
        newZoom = Math.max(zoom - altitude, 0);
        break;
      
      case 'pitchUp':
        newPitch = Math.min(pitch + pitchSpeed, 85);
        break;
      
      case 'pitchDown':
        newPitch = Math.max(pitch - pitchSpeed, 0);
        break;
      
      case 'bearingLeft':
        newBearing = (bearing - bearingSpeed + 360) % 360;
        break;
      
      case 'bearingRight':
        newBearing = (bearing + bearingSpeed) % 360;
        break;
      
      case 'speedDown':
        this._flightControls.speed = Math.max(this._flightControls.speed - 0.1, 0.1);
        this._updateSpeedDisplay();
        break;
      
      case 'speedUp':
        this._flightControls.speed = Math.min(this._flightControls.speed + 0.1, 2.0);
        this._updateSpeedDisplay();
        break;
    }

    // Apply the changes
    this._map.setCenter(newCenter);
    if (newZoom !== zoom) this._map.setZoom(newZoom);
    if (newPitch !== pitch) this._map.setPitch(newPitch);
    if (newBearing !== bearing) this._map.setBearing(newBearing);
  }

  private toggleFlightMode(): void {
    if (this._isActive) {
      this.stopFlightMode();
    } else {
      this.startFlightMode();
    }
  }

  private startFlightMode(): void {
    this._isActive = true;
    this._flightControls.isActive = true;
    this._updateUI();
    this._startAnimation();
  }

  private stopFlightMode(): void {
    this._isActive = false;
    this._flightControls.isActive = false;
    this._keys.clear();
    this._updateUI();
    this._stopAnimation();
  }

  private _startAnimation(): void {
    if (this._animationId) return;

    const animate = () => {
      if (this._isActive) {
        // Continuous movement based on pressed keys
        this._keys.forEach(keyCode => {
          const action = this._keyMappings[keyCode as keyof typeof this._keyMappings];
          if (action && action !== 'toggle' && action !== 'stop') {
            this._handleMovement(action);
          }
        });
        this._animationId = requestAnimationFrame(animate);
      }
    };

    this._animationId = requestAnimationFrame(animate);
  }

  private _stopAnimation(): void {
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }
  }

  private _updateUI(): void {
    const container = this._container.querySelector('.flight-controls') as HTMLElement;
    const statusText = this._container.querySelector('.status-text') as HTMLElement;
    
    if (container && statusText) {
      if (this._isActive) {
        container.classList.add('active');
        statusText.textContent = 'ON';
        statusText.style.color = '#10b981';
      } else {
        container.classList.remove('active');
        statusText.textContent = 'OFF';
        statusText.style.color = '#6b7280';
      }
    }
  }

  private _updateSpeedDisplay(): void {
    if (this._speedValue) {
      this._speedValue.textContent = this._flightControls.speed.toFixed(1);
    }
  }
}
