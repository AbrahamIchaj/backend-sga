// Ejemplo de implementación frontend para búsqueda reactiva
// Este archivo es solo un ejemplo - puedes adaptarlo a tu framework (Angular, React, Vue, etc.)

class SearchService {
  private apiUrl = 'http://localhost:3000/api/v1';
  private abortController: AbortController | null = null;

  // Búsqueda con debounce para evitar muchas requests
  async searchWithDebounce(query: string, endpoint: string, delay: number = 300): Promise<any[]> {
    return new Promise((resolve, reject) => {
      // Cancelar búsqueda anterior si existe
      if (this.abortController) {
        this.abortController.abort();
      }

      // Crear nuevo AbortController
      this.abortController = new AbortController();

      // Aplicar delay (debounce)
      setTimeout(async () => {
        try {
          const response = await fetch(
            `${this.apiUrl}/${endpoint}/search?query=${encodeURIComponent(query)}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              signal: this.abortController?.signal,
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          resolve(result.data || []);
        } catch (error) {
          if (error.name === 'AbortError') {
            // Búsqueda cancelada, no hacer nada
            return;
          }
          reject(error);
        }
      }, delay);
    });
  }

  // Buscar insumos
  async searchInsumos(query: string): Promise<any[]> {
    return this.searchWithDebounce(query, 'catalogo-insumos');
  }

  // Buscar servicios
  async searchServicios(query: string): Promise<any[]> {
    return this.searchWithDebounce(query, 'servicios');
  }

  // Cancelar búsqueda actual
  cancelCurrentSearch(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

// Ejemplo de uso con HTML y JavaScript vanilla
class AutocompleteComponent {
  private searchService = new SearchService();
  private currentResults: any[] = [];

  constructor(private inputElement: HTMLInputElement, private resultsContainer: HTMLElement) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.inputElement.addEventListener('input', (event) => {
      const query = (event.target as HTMLInputElement).value.trim();
      
      if (query.length >= 2) {
        this.performSearch(query);
      } else {
        this.clearResults();
      }
    });

    this.inputElement.addEventListener('keydown', (event) => {
      this.handleKeyNavigation(event);
    });
  }

  private async performSearch(query: string): Promise<void> {
    try {
      // Mostrar indicador de carga
      this.showLoading();

      // Realizar búsqueda (puedes cambiar 'catalogo-insumos' por 'servicios')
      const results = await this.searchService.searchInsumos(query);
      
      this.currentResults = results;
      this.displayResults(results);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      this.showError('Error al realizar la búsqueda');
    }
  }

  private displayResults(results: any[]): void {
    this.resultsContainer.innerHTML = '';

    if (results.length === 0) {
      this.resultsContainer.innerHTML = '<div class="no-results">No se encontraron resultados</div>';
      return;
    }

    results.forEach((item, index) => {
      const resultItem = document.createElement('div');
      resultItem.className = 'search-result-item';
      resultItem.setAttribute('data-index', index.toString());
      
      // Para insumos
      if (item.nombreInsumo) {
        resultItem.innerHTML = `
          <div class="result-title">${item.nombreInsumo}</div>
          <div class="result-subtitle">Código: ${item.codigoInsumo}</div>
          ${item.caracteristicas ? `<div class="result-description">${item.caracteristicas}</div>` : ''}
        `;
      } 
      // Para servicios
      else if (item.nombre) {
        resultItem.innerHTML = `
          <div class="result-title">${item.nombre}</div>
          ${item.observaciones ? `<div class="result-description">${item.observaciones}</div>` : ''}
        `;
      }

      resultItem.addEventListener('click', () => {
        this.selectItem(item);
      });

      this.resultsContainer.appendChild(resultItem);
    });
  }

  private selectItem(item: any): void {
    // Aquí puedes manejar la selección del item
    console.log('Item seleccionado:', item);
    
    // Llenar el input con el nombre seleccionado
    if (item.nombreInsumo) {
      this.inputElement.value = item.nombreInsumo;
    } else if (item.nombre) {
      this.inputElement.value = item.nombre;
    }
    
    // Limpiar resultados
    this.clearResults();
    
    // Emitir evento personalizado para notificar la selección
    const customEvent = new CustomEvent('itemSelected', { detail: item });
    this.inputElement.dispatchEvent(customEvent);
  }

  private handleKeyNavigation(event: KeyboardEvent): void {
    const items = this.resultsContainer.querySelectorAll('.search-result-item');
    const currentActive = this.resultsContainer.querySelector('.search-result-item.active');
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveSelection(items, currentActive, 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveSelection(items, currentActive, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (currentActive) {
          const index = parseInt(currentActive.getAttribute('data-index') || '0');
          this.selectItem(this.currentResults[index]);
        }
        break;
      case 'Escape':
        this.clearResults();
        break;
    }
  }

  private moveSelection(items: NodeListOf<Element>, currentActive: Element | null, direction: number): void {
    if (items.length === 0) return;

    // Remover clase active actual
    if (currentActive) {
      currentActive.classList.remove('active');
    }

    let newIndex = 0;
    if (currentActive) {
      const currentIndex = parseInt(currentActive.getAttribute('data-index') || '0');
      newIndex = currentIndex + direction;
    }

    // Manejar límites
    if (newIndex < 0) newIndex = items.length - 1;
    if (newIndex >= items.length) newIndex = 0;

    // Activar nuevo item
    items[newIndex].classList.add('active');
  }

  private showLoading(): void {
    this.resultsContainer.innerHTML = '<div class="loading">Buscando...</div>';
  }

  private showError(message: string): void {
    this.resultsContainer.innerHTML = `<div class="error">${message}</div>`;
  }

  private clearResults(): void {
    this.resultsContainer.innerHTML = '';
    this.currentResults = [];
  }
}

// CSS básico para el componente (agregar a tu archivo CSS)
const cssStyles = `
.search-container {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 16px;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ccc;
  border-top: none;
  border-radius: 0 0 8px 8px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.search-result-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.search-result-item:hover,
.search-result-item.active {
  background-color: #f5f5f5;
}

.search-result-item:last-child {
  border-bottom: none;
}

.result-title {
  font-weight: bold;
  color: #333;
}

.result-subtitle {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.result-description {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.loading, .error, .no-results {
  padding: 12px 16px;
  text-align: center;
  color: #666;
  font-style: italic;
}

.error {
  color: #d32f2f;
}
`;

// Ejemplo de inicialización
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput') as HTMLInputElement;
  const searchResults = document.getElementById('searchResults') as HTMLElement;
  
  if (searchInput && searchResults) {
    const autocomplete = new AutocompleteComponent(searchInput, searchResults);
    
    // Escuchar selecciones
    searchInput.addEventListener('itemSelected', (event: any) => {
      console.log('Item seleccionado:', event.detail);
      // Aquí puedes hacer lo que necesites con el item seleccionado
    });
  }
});

export { SearchService, AutocompleteComponent };
