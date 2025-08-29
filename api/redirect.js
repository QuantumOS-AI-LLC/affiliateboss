// Redirect handler for short links (/go/:shortCode)
import { handleCORS } from './_utils.js'

export default function handler(req, res) {
  if (handleCORS(req, res)) return

  const { code } = req.query
  
  if (!code) {
    return res.status(400).json({ error: 'Short code required' })
  }
  
  // For demo purposes, simulate link tracking and redirect
  // In production, this would:
  // 1. Look up the original URL from database using short code
  // 2. Track the click (increment clicks, record visitor info)
  // 3. Update KPI stats
  // 4. Redirect to original URL
  
  // Demo redirect mapping
  const demoLinks = {
    'mbp001': 'https://apple.com/macbook-pro',
    'tesla02': 'https://tesla.com/models',
    'ip15pm': 'https://apple.com/iphone-15-pro',
    'sony01': 'https://sony.com/headphones/wh-1000xm5',
    'canr5': 'https://canon.com/cameras/eos-r5'
  }
  
  const originalUrl = demoLinks[code]
  
  if (!originalUrl) {
    return res.status(404).json({ error: 'Link not found' })
  }
  
  // Log the click for demo purposes
  console.log(`Click tracked for code: ${code} -> ${originalUrl}`)
  
  // Redirect to original URL
  res.writeHead(302, { Location: originalUrl })
  res.end()
}