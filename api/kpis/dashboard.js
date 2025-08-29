// Dashboard KPIs API endpoint
import { handleCORS, authenticateAPI, getFakeData } from '../_utils.js'

export default function handler(req, res) {
  if (handleCORS(req, res)) return

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Authenticate user
  const user = authenticateAPI(req, res)
  if (!user) return

  // Return fake KPI data for demo
  const { dashboardKPIs } = getFakeData()
  
  return res.status(200).json({
    success: true,
    data: dashboardKPIs
  })
}