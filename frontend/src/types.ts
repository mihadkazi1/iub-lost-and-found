export type ReportType = 'lost' | 'found'
export type ItemStatus = 'open' | 'resolved'

export interface Student {
  student_id: string
  full_name: string
  phone_number: string | null
  whatsapp_number: string | null
  extra_contact_info: string | null
}

export interface CampusItem {
  id: number
  title: string
  description: string
  category: string
  report_type: ReportType
  location: string
  incident_date: string | null
  status: ItemStatus
  reporter_name: string
  created_at: string
  is_owner: boolean
  contact_available: boolean
  contact_info?: string | null
  image_url: string | null
}

export interface BoardStats {
  total_reports: number
  open_reports: number
  resolved_reports: number
  lost_reports: number
  found_reports: number
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: Student
}

export interface ItemDraft {
  title: string
  description: string
  category: string
  report_type: ReportType
  location: string
  incident_date: string
  contact_info: string
  image_data?: string | null
}
