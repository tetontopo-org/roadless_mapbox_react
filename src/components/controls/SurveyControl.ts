import type mapboxgl from 'mapbox-gl'

export class SurveyControl implements mapboxgl.IControl {
  private _container!: HTMLElement

  onAdd(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'mapboxgl-ctrl'
    const a = document.createElement('a')
    a.className = 'survey-btn'
    a.href = 'https://www.outdooralliance.org/roadless#:~:text=The%20Roadless%20Rule%20protects%2058,%2C%20paddling,%20and%20backcountry%20skiing'
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.textContent = 'Take the Survey'
    container.appendChild(a)
    this._container = container
    return container
  }

  onRemove(): void {
    this._container.remove()
  }

  getDefaultPosition() { return 'top-right' as const }
}