import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Dev-only API for the DevPanel's autosave: persists quest data to
// quest-data/quest-autosave.json so it survives cleared browser storage.
function questAutosaveApi(): Plugin {
  return {
    name: 'quest-autosave-api',
    configureServer(server) {
      server.middlewares.use('/api/save-quests', (req, res, next) => {
        const filePath = path.join(process.cwd(), 'quest-data', 'quest-autosave.json')

        if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => {
            body += chunk.toString()
          })
          req.on('end', () => {
            try {
              const data = JSON.parse(body)
              fs.mkdirSync(path.dirname(filePath), { recursive: true })
              fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ success: true, path: filePath }))
            } catch (error) {
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ success: false, error: String(error) }))
            }
          })
        } else if (req.method === 'GET') {
          try {
            if (fs.existsSync(filePath)) {
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(fs.readFileSync(filePath, 'utf-8'))
            } else {
              res.writeHead(404, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ success: false, error: 'No autosave file found' }))
            }
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: false, error: String(error) }))
          }
        } else {
          next()
        }
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), questAutosaveApi()],
  server: {
    port: Number(process.env.PORT) || 5173,
  },
})
