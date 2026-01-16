/**
 * API Client - SDI Gestión Documental
 * 
 * Proporciona métodos para comunicarse con el servidor mediante AJAX.
 * Maneja errores y proporciona respuestas JSON estructuradas.
 * 
 * @author SDI Development Team
 * @version 2.0
 */

const api = {
    baseURL: '/Programa-Gestion-SDI/api',

    /**
     * Función auxiliar para logging de errores
     */
    _logError(context, error, response = null) {
        const errorInfo = {
            context: context,
            error: error?.message || String(error),
            stack: error?.stack,
            timestamp: new Date().toISOString()
        };

        if (response && response.headers && typeof response.headers.entries === 'function') {
            errorInfo.response = {
                status: response.status,
                statusText: response.statusText,
                url: response.url,
                headers: Object.fromEntries(response.headers.entries())
            };
        } else if (response) {
            errorInfo.response = response;
        }

        console.error('[API Error]', errorInfo);
        
        // Intentar guardar en localStorage para debugging
        try {
            const errorLog = JSON.parse(localStorage.getItem('api_errors') || '[]');
            errorLog.push(errorInfo);
            // Mantener solo los últimos 10 errores
            if (errorLog.length > 10) errorLog.shift();
            localStorage.setItem('api_errors', JSON.stringify(errorLog));
        } catch (e) {
            console.warn('No se pudo guardar error en localStorage:', e);
        }
    },

    /**
     * Función auxiliar para procesar respuesta
     */
    async _processResponse(response, endpoint, method) {
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');
        
        // Log de información de respuesta
        console.log(`[API] ${method} ${endpoint} - Status: ${response.status} ${response.statusText}`);
        
        // Obtener texto de respuesta primero
        const responseText = await response.text();
        
        // Si la respuesta está vacía
        if (!responseText || responseText.trim() === '') {
            console.error('[API] Respuesta vacía del servidor');
            throw new Error(`Respuesta vacía del servidor (Status: ${response.status})`);
        }

        // Intentar parsear como JSON
        let jsonData;
        try {
            jsonData = JSON.parse(responseText);
            // Validar que el objeto tenga la estructura esperada
            if (typeof jsonData !== 'object' || jsonData === null) {
                throw new Error('La respuesta no es un objeto válido');
            }
        } catch (parseError) {
            // Si no es JSON válido, loggear el contenido
            console.error('[API] Error parseando JSON:', {
                endpoint,
                status: response.status,
                contentType,
                responseText: responseText.substring(0, 500), // Primeros 500 caracteres
                parseError: parseError.message
            });
            
            // Si esperábamos JSON pero no lo es, lanzar error
            if (isJson || response.status >= 400) {
                throw new Error(`Respuesta inválida del servidor: ${responseText.substring(0, 100)}...`);
            }
            
            // Si no esperábamos JSON, retornar texto
            return {
                success: response.ok,
                message: responseText,
                data: null,
                status: response.status
            };
        }

        // Agregar información de status a la respuesta
        if (!jsonData.hasOwnProperty('status')) {
            jsonData.status = response.status;
        }

        // Si hay error HTTP, lanzar excepción con información detallada
        if (!response.ok) {
            const error = new Error(jsonData.message || `Error HTTP ${response.status}: ${response.statusText}`);
            error.status = response.status;
            error.data = jsonData;
            throw error;
        }

        return jsonData;
    },

    /**
     * Realizar petición GET
     */
    async get(endpoint, params = {}) {
        try {
            let url = this.baseURL + endpoint;
            
            if (Object.keys(params).length > 0) {
                const queryString = new URLSearchParams(params).toString();
                url += '?' + queryString;
            }

            console.log(`[API] GET ${url}`);
            
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            
            return await this._processResponse(response, endpoint, 'GET');
            
        } catch (error) {
            this._logError(`GET ${endpoint}`, error);
            
            // Si es un error de red
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('Error de conexión: No se pudo conectar con el servidor');
            }
            
            throw error;
        }
    },

    /**
     * Realizar petición POST
     */
    async post(endpoint, data = {}) {
        let response = null;
        try {
            const url = this.baseURL + endpoint;
            const body = JSON.stringify(data);
            
            console.log(`[API] POST ${url}`, data);
            
            response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: body
            });
            
            return await this._processResponse(response, endpoint, 'POST');
            
        } catch (error) {
            this._logError(`POST ${endpoint}`, error, response);
            
            // Si es un error de red
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('Error de conexión: No se pudo conectar con el servidor');
            }
            
            throw error;
        }
    },

    /**
     * Realizar petición PUT
     */
    async put(endpoint, data = {}) {
        try {
            const url = this.baseURL + endpoint;
            
            console.log(`[API] PUT ${url}`, data);
            
            const response = await fetch(url, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            return await this._processResponse(response, endpoint, 'PUT');
            
        } catch (error) {
            this._logError(`PUT ${endpoint}`, error, { data });
            
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('Error de conexión: No se pudo conectar con el servidor');
            }
            
            throw error;
        }
    },

    /**
     * Realizar petición DELETE
     */
    async delete(endpoint) {
        try {
            const url = this.baseURL + endpoint;
            
            console.log(`[API] DELETE ${url}`);
            
            const response = await fetch(url, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            
            return await this._processResponse(response, endpoint, 'DELETE');
            
        } catch (error) {
            this._logError(`DELETE ${endpoint}`, error);
            
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('Error de conexión: No se pudo conectar con el servidor');
            }
            
            throw error;
        }
    },

    /**
     * Realizar petición PATCH
     */
    async patch(endpoint, data = {}) {
        try {
            const url = this.baseURL + endpoint;
            
            console.log(`[API] PATCH ${url}`, data);
            
            const response = await fetch(url, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            return await this._processResponse(response, endpoint, 'PATCH');
            
        } catch (error) {
            this._logError(`PATCH ${endpoint}`, error, { data });
            
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('Error de conexión: No se pudo conectar con el servidor');
            }
            
            throw error;
        }
    }
};
