import { useCallback, useEffect, useMemo, useState, type ButtonHTMLAttributes, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import {
  ArrowDownRight, ArrowRight, Bell, BookOpen, BriefcaseBusiness, Check, CheckCircle2,
  ChevronDown, CircleHelp, Clock3, Compass, FileText, GraduationCap, HeartHandshake,
  KeyRound, Laptop, LifeBuoy, LockKeyhole, LogIn, MapPin, Menu, MessageCircle, Package, Phone, Plus,
  Search, ShieldCheck, Sparkles, Tag, Trash2, UserRound, Wallet, Watch, X, Shirt, ImagePlus, Eye, Pencil, RotateCcw,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  clearToken, createItem, deleteItem, getContact, getItem, getItems, getMe, getStats, getToken,
  saveToken, signIn, signOut, updateItem, updateStatus,
} from './api'
import type { BoardStats, CampusItem, ItemDraft, Student } from './types'

const CATEGORIES = ['All items', 'Electronics', 'Cards & IDs', 'Bags', 'Clothing', 'Books', 'Keys', 'Accessories', 'Other']
const IUB_LOGO_URL = 'https://iub.ac.bd/_next/image?q=75&url=https%3A%2F%2Fiub.ac.bd%2Fmedia-backend%2Fmedia%2Fiub-logo_2024_white-e494c305-a2ce-4335-8f80-6c27563f50d6.png&w=256'

const categoryIcons: Record<string, LucideIcon> = {
  Electronics: Laptop,
  'Cards & IDs': Wallet,
  Bags: BriefcaseBusiness,
  Clothing: Shirt,
  Books: BookOpen,
  Keys: KeyRound,
  Accessories: Watch,
  Other: Package,
}

const categoryTone: Record<string, string> = {
  Electronics: 'tone-lilac',
  'Cards & IDs': 'tone-blue',
  Bags: 'tone-sand',
  Clothing: 'tone-rose',
  Books: 'tone-mint',
  Keys: 'tone-gold',
  Accessories: 'tone-sky',
  Other: 'tone-slate',
}

function formatDate(value: string | null): string {
  if (!value) return 'Date not specified'
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatCreatedAt(value: string): string {
  const parsed = new Date(value.endsWith('Z') ? value : `${value}Z`)
  if (Number.isNaN(parsed.getTime())) return 'Recently'
  const hours = Math.floor((Date.now() - parsed.getTime()) / 3_600_000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return parsed.toLocaleDateString('en-BD', { day: 'numeric', month: 'short' })
}

function BrandMark() {
  const [logoFailed, setLogoFailed] = useState(false)
  return (
    <div className="brand-mark" aria-label="Independent University, Bangladesh">
      {logoFailed ? (
        <div className="logo-fallback"><ShieldCheck size={30} strokeWidth={1.8} /><span>IUB</span></div>
      ) : (
        <img src={IUB_LOGO_URL} alt="IUB official logo" onError={() => setLogoFailed(true)} />
      )}
    </div>
  )
}

function IconTile({ category }: { category: string }) {
  const Icon = categoryIcons[category] || CircleHelp
  return (
    <div className={`item-art ${categoryTone[category] || 'tone-slate'}`} aria-hidden="true">
      <span className="art-orbit art-orbit-one" />
      <span className="art-orbit art-orbit-two" />
      <div className="art-icon"><Icon size={31} strokeWidth={1.75} /></div>
      <span className="art-spark">✦</span>
    </div>
  )
}

function Button({ children, variant = 'primary', className = '', ...props }: {
  children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'outline'; className?: string
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`btn btn-${variant} ${className}`} {...props}>{children}</button>
}

function Modal({ title, eyebrow, onClose, children, wide = false }: {
  title: string; eyebrow?: string; onClose: () => void; children: ReactNode; wide?: boolean
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className={`modal-panel ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <button className="modal-close" aria-label="Close dialog" onClick={onClose}><X size={20} /></button>
        {eyebrow && <p className="eyebrow modal-eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  )
}

function LoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (user: Student) => void }) {
  const [studentId, setStudentId] = useState('')
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [extraContactInfo, setExtraContactInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await signIn(studentId, fullName, phoneNumber, whatsappNumber, extraContactInfo)
      saveToken(result.access_token)
      onSuccess(result.user)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Welcome to the campus community." eyebrow="STUDENT ACCESS" onClose={onClose}>
      <p className="modal-copy">Sign in with your student details and contact number so another student can reach you if they find your item.</p>
      <form className="form-stack" onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="student-id">Student ID</label>
        <input id="student-id" className="text-input" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="e.g. 2310123" autoComplete="username" minLength={4} maxLength={32} required />
        <label className="field-label" htmlFor="student-name">Full name</label>
        <input id="student-name" className="text-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name as a student" autoComplete="name" minLength={2} maxLength={100} required />
        <label className="field-label" htmlFor="student-phone">Mobile / phone number <span className="required-mark">*</span></label>
        <input id="student-phone" className="text-input" type="tel" inputMode="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g. 01712345678" autoComplete="tel" minLength={7} maxLength={25} required />
        <label className="field-label" htmlFor="student-whatsapp">WhatsApp number</label>
        <input id="student-whatsapp" className="text-input" type="tel" inputMode="tel" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="WhatsApp number, if different" maxLength={25} />
        <span className="field-hint">Leave blank if your WhatsApp uses the same number as your phone.</span>
        <label className="field-label" htmlFor="student-extra-info">Additional contact information <span className="optional-mark">(optional)</span></label>
        <textarea id="student-extra-info" className="text-input text-area compact-text-area" value={extraContactInfo} onChange={(e) => setExtraContactInfo(e.target.value)} placeholder="e.g. Best time to call, campus email, or other useful details" maxLength={240} rows={2} />
        {error && <p className="form-error" role="alert">{error}</p>}
        <Button type="submit" disabled={busy} className="btn-full">{busy ? 'Signing in…' : 'Continue as student'} <ArrowRight size={17} /></Button>
      </form>
      <div className="secure-note"><LockKeyhole size={15} /><span>Contact details are only shared with signed-in users. Demo sign-in does not verify IUB identity.</span></div>
    </Modal>
  )
}

function ReportModal({ onClose, onSubmit, busy, error, initialItem }: {
  onClose: () => void; onSubmit: (draft: ItemDraft) => Promise<void>; busy: boolean; error: string; initialItem?: CampusItem
}) {
  const [reportType, setReportType] = useState<'lost' | 'found'>(initialItem?.report_type ?? 'lost')
  const [title, setTitle] = useState(initialItem?.title ?? '')
  const [category, setCategory] = useState(initialItem?.category ?? 'Electronics')
  const [description, setDescription] = useState(initialItem?.description ?? '')
  const [location, setLocation] = useState(initialItem?.location ?? '')
  const [incidentDate, setIncidentDate] = useState(initialItem?.incident_date ?? new Date().toISOString().slice(0, 10))
  const [contactInfo, setContactInfo] = useState(initialItem?.contact_info ?? 'Please contact me using the phone or WhatsApp details in my student profile.')
  const [imageData, setImageData] = useState<string | null>(null)
  const [imageName, setImageName] = useState('')
  const [imageChanged, setImageChanged] = useState(false)
  const [imageError, setImageError] = useState('')

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setImageError('')
    if (!file) return
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setImageData(null)
      setImageName('')
      setImageError('Please choose a JPG, PNG, or WebP image.')
      event.target.value = ''
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setImageData(null)
      setImageName('')
      setImageError('The image must be 2 MB or smaller.')
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageData(reader.result)
        setImageName(file.name)
        setImageChanged(true)
      } else {
        setImageError('Could not read this image. Please try another file.')
      }
    }
    reader.onerror = () => setImageError('Could not read this image. Please try another file.')
    reader.readAsDataURL(file)
  }

  function removeImage() {
    setImageData(null)
    setImageName('')
    setImageChanged(true)
    setImageError('')
    const input = document.getElementById('item-image') as HTMLInputElement | null
    if (input) input.value = ''
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (imageError) return
    await onSubmit({
      title, description, category, report_type: reportType, location, incident_date: incidentDate, contact_info: contactInfo,
      // Omit image_data for an edit when the user leaves the existing photo unchanged.
      image_data: initialItem && !imageChanged ? undefined : imageData,
    })
  }

  return (
    <Modal title={initialItem ? 'Update your report' : 'Tell the campus community'} eyebrow={initialItem ? 'EDIT REPORT' : 'NEW REPORT'} onClose={onClose} wide>
      <p className="modal-copy">{initialItem ? 'Update the details below and save your changes.' : 'Share a few helpful details and add a photo if you have one.'} For safety, do not include passwords, full card numbers, or other sensitive information.</p>
      <form className="form-stack report-form" onSubmit={handleSubmit}>
        <div className="segmented" role="group" aria-label="Report type">
          <button type="button" className={reportType === 'lost' ? 'selected lost-selected' : ''} onClick={() => setReportType('lost')}><Search size={16} /> I lost something</button>
          <button type="button" className={reportType === 'found' ? 'selected found-selected' : ''} onClick={() => setReportType('found')}><HeartHandshake size={16} /> I found something</button>
        </div>
        <div className="form-grid">
          <div className="form-field form-field-full">
            <label className="field-label" htmlFor="item-title">Item name</label>
            <input id="item-title" className="text-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Black wireless earbuds case" minLength={4} maxLength={100} required />
          </div>
          <div className="form-field">
            <label className="field-label" htmlFor="item-category">Category</label>
            <div className="select-wrap"><select id="item-category" className="text-input" value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.slice(1).map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={16} /></div>
          </div>
          <div className="form-field">
            <label className="field-label" htmlFor="item-date">Date {reportType === 'lost' ? 'lost' : 'found'}</label>
            <input id="item-date" className="text-input" type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} />
          </div>
          <div className="form-field form-field-full">
            <label className="field-label" htmlFor="item-location">Where on campus?</label>
            <input id="item-location" className="text-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Library, 2nd floor study area" minLength={2} maxLength={120} required />
          </div>
          <div className="form-field form-field-full">
            <label className="field-label" htmlFor="item-description">Description</label>
            <textarea id="item-description" className="text-input text-area" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Color, brand, distinctive marks, or other details that can help identify it…" minLength={10} maxLength={1500} required rows={4} />
          </div>
          <div className="form-field form-field-full">
            <label className="field-label" htmlFor="item-image">Item photo <span className="optional-mark">(optional)</span></label>
            <div className={`image-upload-box ${(imageData || (initialItem?.image_url && !imageChanged)) ? 'has-image' : ''}`}>
              {imageData || (initialItem?.image_url && !imageChanged) ? (
                <div className="image-upload-preview"><img src={imageData ?? initialItem?.image_url ?? ''} alt="Item photo preview" /><div className="image-preview-copy"><strong>{imageName || 'Current report photo'}</strong><span>{imageData ? 'Ready to attach to your report' : 'Existing photo will be kept'}</span><Button type="button" variant="ghost" onClick={removeImage}><X size={14} /> Remove photo</Button></div></div>
              ) : (
                <label className="image-upload-prompt" htmlFor="item-image"><span className="image-upload-icon"><ImagePlus size={22} /></span><span><strong>Choose an item photo</strong><small>JPG, PNG or WebP · up to 2 MB</small></span><span className="image-upload-action">Browse files</span></label>
              )}
              <input id="item-image" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} />
            </div>
            {imageError && <p className="form-error" role="alert">{imageError}</p>}
            <span className="field-hint">A clear photo can help another student identify the item faster. Avoid showing private information.</span>
          </div>
          <div className="form-field form-field-full">
            <label className="field-label" htmlFor="item-contact">Extra contact instructions</label>
            <textarea id="item-contact" className="text-input text-area compact-text-area" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} placeholder="e.g. Call after 2 PM, or meet at the library reception" minLength={3} maxLength={180} required rows={2} />
            <span className="field-hint">Your phone and WhatsApp details are taken from your student profile and shown only to signed-in students.</span>
          </div>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions"><Button variant="ghost" type="button" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy || Boolean(imageError)}>{busy ? (initialItem ? 'Saving…' : 'Publishing…') : (initialItem ? 'Save changes' : 'Publish report')} <ArrowRight size={17} /></Button></div>
      </form>
    </Modal>
  )
}

type ContactDetails = {
  reporter_name: string
  phone_number: string | null
  whatsapp_number: string | null
  extra_contact_info: string | null
  contact_info: string
}

function whatsappLink(number: string): string {
  let digits = number.replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('0')) digits = `880${digits.slice(1)}`
  return `https://wa.me/${digits}`
}

function ContactModal({ item, contact, loading, onClose, error }: {
  item: CampusItem; contact: ContactDetails | null; loading: boolean; onClose: () => void; error: string
}) {
  return (
    <Modal title="Connect with the reporter" eyebrow="CAMPUS CONNECTION" onClose={onClose}>
      <div className="contact-item-summary">{item.image_url ? <img className="contact-item-photo" src={item.image_url} alt={item.title} /> : <IconTile category={item.category} />}<div><span className={`type-pill ${item.report_type}`}>{item.report_type === 'lost' ? 'Lost item' : 'Found item'}</span><h3>{item.title}</h3><p><MapPin size={14} /> {item.location}</p></div></div>
      {loading ? <div className="contact-loading"><span className="spinner" /> Fetching contact details…</div> : error ? <p className="form-error">{error}</p> : contact && <div className="contact-details">
        <span className="contact-label">POSTED BY</span><strong>{contact.reporter_name}</strong>
        {contact.phone_number ? <a className="contact-method" href={`tel:${contact.phone_number.replace(/[^\d+]/g, '')}`}><Phone size={16} /><span><small>PHONE</small>{contact.phone_number}</span></a> : <p className="contact-missing">This sample reporter has not added a phone number yet.</p>}
        {contact.whatsapp_number && <a className="contact-method whatsapp-method" href={whatsappLink(contact.whatsapp_number)} target="_blank" rel="noreferrer"><MessageCircle size={16} /><span><small>WHATSAPP</small>{contact.whatsapp_number}</span><ArrowDownRight size={14} /></a>}
        {contact.extra_contact_info && <><span className="contact-label">ADDITIONAL CONTACT INFO</span><p>{contact.extra_contact_info}</p></>}
        <span className="contact-label">REPORT-SPECIFIC INSTRUCTIONS</span><p>{contact.contact_info}</p>
      </div>}
      <p className="safety-note"><ShieldCheck size={16} /> Meet in a public campus location, and verify ownership before handing over an item.</p>
      <Button variant="secondary" className="btn-full" onClick={onClose}>Done</Button>
    </Modal>
  )
}

function ItemCard({ item, onView, onContact, onEdit, onResolve, onDelete, busyResolve }: {
  item: CampusItem
  onView: (item: CampusItem) => void
  onContact: (item: CampusItem) => void
  onEdit: (item: CampusItem) => void
  onResolve: (item: CampusItem) => void
  onDelete: (item: CampusItem) => void
  busyResolve: boolean
}) {
  return (
    <article className={`item-card ${item.status === 'resolved' ? 'item-card-resolved' : ''}`}>
      <div className="card-art-wrap">{item.image_url ? <img className="item-photo" src={item.image_url} alt={item.title} loading="lazy" /> : <IconTile category={item.category} />}<span className={`type-pill ${item.report_type}`}>{item.report_type === 'lost' ? 'Lost' : 'Found'}</span>{item.status === 'resolved' && <span className="resolved-pill"><Check size={13} /> Resolved</span>}</div>
      <div className="item-card-body">
        <div className="card-meta-row"><span className="category-label"><Tag size={13} /> {item.category}</span><span className="posted-time"><Clock3 size={13} /> {formatCreatedAt(item.created_at)}</span></div>
        <h3>{item.title}</h3>
        <p className="item-description">{item.description}</p>
        <div className="item-location"><MapPin size={15} /><span>{item.location}</span></div>
        <div className="item-card-footer">
          <div className="reporter"><span className="reporter-avatar">{item.reporter_name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><div><strong>{item.reporter_name}</strong><span>{item.incident_date ? formatDate(item.incident_date) : 'Date not specified'}</span></div></div>
          <div className="card-actions">
            <button className="contact-button" onClick={() => onView(item)} aria-label={`View details for ${item.title}`}>Details <Eye size={14} /></button>
            {item.status === 'open' && <button className="contact-button" onClick={() => onContact(item)} aria-label={`Contact reporter for ${item.title}`}>Connect <ArrowRight size={15} /></button>}
            {item.is_owner && <button className="resolve-button edit-button" onClick={() => onEdit(item)} title="Edit report" aria-label="Edit report"><Pencil size={14} /></button>}
            {item.is_owner && <button className="resolve-button" disabled={busyResolve} onClick={() => onResolve(item)} title={item.status === 'open' ? 'Mark as resolved' : 'Reopen report'} aria-label={item.status === 'open' ? 'Mark report resolved' : 'Reopen report'}>{item.status === 'open' ? <CheckCircle2 size={17} /> : <RotateCcw size={15} />}</button>}
            {item.is_owner && <button className="resolve-button delete-button" onClick={() => onDelete(item)} title="Delete report" aria-label="Delete report"><Trash2 size={15} /></button>}
          </div>
        </div>
      </div>
    </article>
  )
}

function ItemDetailsModal({ item, loading, error, onClose }: {
  item: CampusItem; loading: boolean; error: string; onClose: () => void
}) {
  return (
    <Modal title="Report details" eyebrow="ITEM RECORD" onClose={onClose} wide>
      {loading ? <div className="contact-loading"><span className="spinner" /> Loading this report…</div> : error ? <p className="form-error" role="alert">{error}</p> : (
        <div className="item-details-layout">
          <div className="item-details-photo">{item.image_url ? <img src={item.image_url} alt={item.title} /> : <IconTile category={item.category} />}</div>
          <div className="item-details-content">
            <div className="details-badges"><span className={`type-pill ${item.report_type}`}>{item.report_type === 'lost' ? 'Lost item' : 'Found item'}</span><span className={`details-status ${item.status}`}>{item.status === 'open' ? 'Open' : 'Resolved'}</span></div>
            <h3>{item.title}</h3>
            <p className="details-description">{item.description}</p>
            <dl className="details-list">
              <div><dt>Category</dt><dd>{item.category}</dd></div>
              <div><dt>Campus location</dt><dd>{item.location}</dd></div>
              <div><dt>Date reported lost/found</dt><dd>{formatDate(item.incident_date)}</dd></div>
              <div><dt>Posted by</dt><dd>{item.reporter_name}</dd></div>
              <div><dt>Created</dt><dd>{formatCreatedAt(item.created_at)}</dd></div>
              {item.is_owner && item.contact_info && <div><dt>Contact instructions</dt><dd>{item.contact_info}</dd></div>}
            </dl>
          </div>
        </div>
      )}
      <div className="form-actions"><Button variant="secondary" onClick={onClose}>Close details</Button></div>
    </Modal>
  )
}

function App() {
  const [user, setUser] = useState<Student | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CampusItem | null>(null)
  const [detailItem, setDetailItem] = useState<CampusItem | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [reportAfterLogin, setReportAfterLogin] = useState(false)
  const [contactItem, setContactItem] = useState<CampusItem | null>(null)
  const [contactData, setContactData] = useState<ContactDetails | null>(null)
  const [contactLoading, setContactLoading] = useState(false)
  const [contactError, setContactError] = useState('')
  const [contactRequest, setContactRequest] = useState<CampusItem | null>(null)
  const [items, setItems] = useState<CampusItem[]>([])
  const [stats, setStats] = useState<BoardStats>({ total_reports: 0, open_reports: 0, resolved_reports: 0, lost_reports: 0, found_reports: 0 })
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All items')
  const [reportType, setReportType] = useState('all')
  const [statusFilter, setStatusFilter] = useState('open')
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [reportBusy, setReportBusy] = useState(false)
  const [reportError, setReportError] = useState('')
  const [resolvingId, setResolvingId] = useState<number | null>(null)
  const [toast, setToast] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const notify = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3200)
  }, [])

  useEffect(() => {
    let active = true
    const token = getToken()
    if (!token) {
      setAuthReady(true)
      return
    }
    getMe().then((result) => { if (active) setUser(result) }).catch(() => { clearToken(); if (active) setUser(null) }).finally(() => { if (active) setAuthReady(true) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setApiError('')
    getItems({ q: search, category, reportType, status: statusFilter })
      .then((result) => { if (active) setItems(result) })
      .catch((err) => { if (active) { setApiError(err instanceof Error ? err.message : 'Unable to load the board.'); setItems([]) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [search, category, reportType, statusFilter, refreshKey])

  useEffect(() => {
    getStats().then(setStats).catch(() => undefined)
  }, [refreshKey])

  useEffect(() => {
    if (!user || !contactRequest) return
    const pending = contactRequest
    setContactRequest(null)
    setContactItem(pending)
    setContactData(null)
    setContactError('')
    setContactLoading(true)
    getContact(pending.id)
      .then(setContactData)
      .catch((err) => setContactError(err instanceof Error ? err.message : 'Could not load contact instructions.'))
      .finally(() => setContactLoading(false))
  }, [user, contactRequest])

  const currentFilterLabel = useMemo(() => {
    if (reportType === 'lost') return 'Lost items'
    if (reportType === 'found') return 'Found items'
    if (statusFilter === 'resolved') return 'Resolved reports'
    return 'Recently reported'
  }, [reportType, statusFilter])

  function requestReportCreation() {
    setReportError('')
    setEditingItem(null)
    if (user) {
      setReportOpen(true)
      return
    }
    // Keep the user's intent so successful sign-in opens the report form immediately.
    setReportAfterLogin(true)
    setLoginOpen(true)
    notify('Please sign in before posting a lost or found item.')
  }

  function closeLogin() {
    setLoginOpen(false)
    setReportAfterLogin(false)
  }

  function handleLoginSuccess(nextUser: Student) {
    const shouldOpenReport = reportAfterLogin
    setUser(nextUser)
    setRefreshKey((value) => value + 1)
    setReportAfterLogin(false)
    if (shouldOpenReport) { setEditingItem(null); setReportOpen(true) }
    notify(`Welcome, ${nextUser.full_name.split(' ')[0]}! You're signed in.`)
  }

  async function handleLogout() {
    try { await signOut() } catch { clearToken() }
    setUser(null)
    notify('You have signed out.')
  }

  async function handleSaveReport(draft: ItemDraft) {
    // Guard the UI as well as the API: reports may only be created/edited by signed-in owners.
    if (!user || !getToken()) {
      setReportOpen(false)
      setEditingItem(null)
      setReportAfterLogin(true)
      setLoginOpen(true)
      notify('Please sign in before managing a lost or found item.')
      return
    }
    setReportBusy(true)
    setReportError('')
    try {
      if (editingItem) {
        await updateItem(editingItem.id, draft)
        notify('Your report has been updated.')
      } else {
        await createItem(draft)
        notify('Your report is live on the campus board.')
      }
      setReportOpen(false)
      setEditingItem(null)
      setSearch('')
      setCategory('All items')
      setReportType('all')
      setStatusFilter('open')
      setRefreshKey((value) => value + 1)
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Could not save the report.')
    } finally {
      setReportBusy(false)
    }
  }

  async function handleView(item: CampusItem) {
    setDetailItem(item)
    setDetailLoading(true)
    setDetailError('')
    try {
      setDetailItem(await getItem(item.id))
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Could not load this report.')
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleEdit(item: CampusItem) {
    if (!user || !item.is_owner) {
      notify('Please sign in as the report owner to edit this item.')
      return
    }
    setReportError('')
    try {
      // Fetch one report by ID to populate the edit form with its latest saved values.
      const current = await getItem(item.id)
      if (!current.is_owner) {
        notify('You can only edit your own reports.')
        return
      }
      setEditingItem(current)
      setReportOpen(true)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not load the report for editing.')
    }
  }

  async function handleContact(item: CampusItem) {
    if (!user) {
      setContactRequest(item)
      setLoginOpen(true)
      return
    }
    setContactItem(item)
    setContactData(null)
    setContactError('')
    setContactLoading(true)
    try {
      const data = await getContact(item.id)
      setContactData(data)
    } catch (err) {
      setContactError(err instanceof Error ? err.message : 'Could not load contact instructions.')
    } finally {
      setContactLoading(false)
    }
  }

  async function handleResolve(item: CampusItem) {
    const nextStatus = item.status === 'open' ? 'resolved' : 'open'
    setResolvingId(item.id)
    try {
      await updateStatus(item.id, nextStatus)
      setRefreshKey((value) => value + 1)
      notify(nextStatus === 'resolved' ? 'Marked as resolved. Thanks for closing the loop!' : 'Your report is open again.')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not update the report.')
    } finally {
      setResolvingId(null)
    }
  }

  async function handleDelete(item: CampusItem) {
    const confirmed = window.confirm(`Delete “${item.title}” from the campus board? This cannot be undone.`)
    if (!confirmed) return
    try {
      await deleteItem(item.id)
      setRefreshKey((value) => value + 1)
      notify('Your report has been deleted.')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not delete the report.')
    }
  }

  const boardHasFilters = search.trim() !== '' || category !== 'All items' || reportType !== 'all' || statusFilter !== 'open'

  return (
    <div className="app-shell">
      <div className="university-bar">
        <div className="container university-bar-inner">
          <div className="university-brand"><BrandMark /><div><strong>Independent University, Bangladesh</strong><span>Student community service</span></div></div>
          <a className="official-link" href="https://iub.ac.bd/" target="_blank" rel="noreferrer">University website <ArrowDownRight size={14} /></a>
        </div>
      </div>

      <header className="main-header">
        <div className="container header-inner">
          <a href="#top" className="wordmark" aria-label="IUB Lost and Found home"><span className="wordmark-icon"><HeartHandshake size={22} /></span><span>IUB <b>Lost &amp; Found</b></span></a>
          <button className="mobile-menu-button" aria-label="Toggle navigation" onClick={() => setMobileMenuOpen((value) => !value)}><Menu size={22} /></button>
          <nav className={`header-nav ${mobileMenuOpen ? 'nav-open' : ''}`} aria-label="Main navigation">
            <a href="#board" onClick={() => setMobileMenuOpen(false)}>Browse items</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How it works</a>
            <a href="#safety" onClick={() => setMobileMenuOpen(false)}>Safety tips</a>
          </nav>
          <div className="header-actions">
            {user ? (
              <div className="user-menu"><span className="user-avatar"><UserRound size={16} /></span><span className="user-name">{user.full_name.split(' ')[0]}</span><button className="signout-button" onClick={handleLogout} title="Sign out">Sign out</button></div>
            ) : (
              <Button variant="ghost" className="signin-button" onClick={() => setLoginOpen(true)}><LogIn size={16} /> Student sign in</Button>
            )}
            <Button onClick={requestReportCreation} className="header-report"><Plus size={17} /> Post an item</Button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-glow hero-glow-one" /><div className="hero-glow hero-glow-two" />
          <div className="container hero-content">
            <div className="hero-copy">
              <div className="hero-kicker"><span className="live-dot" /> A little campus kindness goes a long way</div>
              <h1>Lost something?<br /><span>Let’s bring it back.</span></h1>
              <p className="hero-subtitle">A shared space for the IUB community to report lost belongings, return found items, and help each other out.</p>
              <div className="hero-search">
                <Search size={20} />
                <input aria-label="Search lost and found items" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Try “student card” or “library”…" />
                {search && <button aria-label="Clear search" onClick={() => setSearch('')}><X size={17} /></button>}
                <button className="search-submit" aria-label="Search reports" onClick={() => document.getElementById('board')?.scrollIntoView({ behavior: 'smooth' })}><ArrowRight size={19} /></button>
              </div>
              <div className="hero-quicklinks"><span>Popular:</span>{['Student ID', 'Electronics', 'Keys'].map((item) => <button key={item} onClick={() => { setSearch(item === 'Student ID' ? 'card' : item); document.getElementById('board')?.scrollIntoView({ behavior: 'smooth' }) }}>{item}</button>)}</div>
              <div className="hero-trust"><span className="avatar-stack"><i>AR</i><i>TH</i><i>NC</i><i>+ </i></span><span>Powered by a <strong>helpful campus community</strong></span></div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="visual-grid" />
              <div className="floating-card floating-card-main">
                <div className="floating-card-top"><span className="found-mini-label"><CheckCircle2 size={13} /> FOUND</span><span className="floating-dots">•••</span></div>
                <div className="illustration-circle illustration-bottle"><div className="bottle-cap" /><div className="bottle-body"><span /></div></div>
                <div className="floating-card-title">Olive green bottle</div><div className="floating-card-sub"><MapPin size={12} /> Student lounge</div>
                <div className="floating-card-bottom"><span className="mini-person">MA</span><span>Maliha A.</span><span className="just-now">Just now</span></div>
              </div>
              <div className="floating-note note-left"><span className="note-icon note-heart"><HeartHandshake size={17} /></span><div><strong>Small act, big impact</strong><span>Help a classmate today</span></div></div>
              <div className="floating-note note-right"><span className="note-icon note-check"><Check size={19} /></span><div><strong>Back where it belongs</strong><span>One more happy ending</span></div></div>
              <div className="hero-sparkle sparkle-one">✦</div><div className="hero-sparkle sparkle-two">✧</div>
            </div>
          </div>
          <div className="hero-bottom-line" />
        </section>

        <section className="stats-section" aria-label="Community activity">
          <div className="container stats-grid">
            <div className="stats-intro"><span className="eyebrow">THE COMMUNITY BOARD</span><p>Every report brings us<br />one step closer.</p></div>
            <div className="stat-item"><span className="stat-icon stat-icon-green"><Package size={19} /></span><div><strong>{stats.total_reports}</strong><span>Total reports</span></div></div>
            <div className="stat-item"><span className="stat-icon stat-icon-blue"><Search size={19} /></span><div><strong>{stats.open_reports}</strong><span>Still looking</span></div></div>
            <div className="stat-item"><span className="stat-icon stat-icon-gold"><HeartHandshake size={19} /></span><div><strong>{stats.resolved_reports}</strong><span>Resolved together</span></div></div>
          </div>
        </section>

        <section className="board-section" id="board">
          <div className="container">
            <div className="section-heading board-heading">
              <div><span className="eyebrow"><span className="eyebrow-line" /> CAMPUS NOTICEBOARD</span><h2>Find what you’re <em>looking for.</em></h2><p>Browse recent reports or post your own to get the word out.</p></div>
              <Button onClick={requestReportCreation}><Plus size={17} /> Create a report</Button>
            </div>
            <div className="board-toolbar">
              <div className="report-tabs" role="tablist" aria-label="Filter by report type">
                {[['all', 'All reports'], ['lost', 'Lost items'], ['found', 'Found items']].map(([value, label]) => <button role="tab" aria-selected={reportType === value} key={value} className={reportType === value ? 'active' : ''} onClick={() => setReportType(value)}>{label}{value === 'lost' && <span className="tab-count">{stats.lost_reports}</span>}{value === 'found' && <span className="tab-count">{stats.found_reports}</span>}</button>)}
              </div>
              <div className="toolbar-controls">
                <label className="select-wrap category-select"><span className="sr-only">Filter by category</span><select className="text-input" value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></label>
                <label className="select-wrap status-select"><span className="sr-only">Filter by status</span><select className="text-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="open">Open reports</option><option value="resolved">Resolved</option><option value="all">All statuses</option></select><ChevronDown size={15} /></label>
              </div>
            </div>
            <div className="board-results-row"><span>{currentFilterLabel} <strong>{loading ? '…' : items.length}</strong></span><span className="results-hint"><ShieldCheck size={14} /> Contact details are visible to signed-in students</span></div>

            {apiError && <div className="connection-error"><div className="connection-error-icon"><LifeBuoy size={22} /></div><div><strong>Couldn’t connect to the project API</strong><p>{apiError}. Start the FastAPI backend using the steps in the README, then refresh this page.</p></div></div>}

            {loading ? (
              <div className="items-grid" aria-label="Loading reports">{[1, 2, 3].map((item) => <div className="item-skeleton" key={item}><div className="skeleton-art" /><div className="skeleton-line skeleton-short" /><div className="skeleton-line" /><div className="skeleton-line skeleton-mid" /></div>)}</div>
            ) : items.length ? (
              <div className="items-grid">{items.map((item) => <ItemCard key={item.id} item={item} onView={handleView} onContact={handleContact} onEdit={handleEdit} onResolve={handleResolve} onDelete={handleDelete} busyResolve={resolvingId === item.id} />)}</div>
            ) : (
              <div className="empty-state"><div className="empty-illustration"><Search size={29} /><Sparkles size={17} /></div><h3>{boardHasFilters ? 'No matching reports yet' : 'A fresh start for the board'}</h3><p>{boardHasFilters ? 'Try another search, category, or report status. A few different keywords can help.' : 'Nothing on the board just yet. Share a report and help the IUB community find its way.'}</p>{boardHasFilters ? <Button variant="secondary" onClick={() => { setSearch(''); setCategory('All items'); setReportType('all'); setStatusFilter('open') }}>Clear filters</Button> : <Button onClick={requestReportCreation}><Plus size={16} /> Post the first report</Button>}</div>
            )}
            <div className="board-footer-note"><div className="footer-note-icon"><Bell size={17} /></div><p><strong>Seen something around campus?</strong> Even a small detail can help reunite an item with its owner.</p><button onClick={requestReportCreation}>Share a report <ArrowRight size={15} /></button></div>
          </div>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="container how-content">
            <div className="how-intro"><span className="eyebrow"><span className="eyebrow-line" /> SIMPLE BY DESIGN</span><h2>Good things find<br />their <em>way back.</em></h2><p>No complicated process. Just three small steps that make campus life a little kinder.</p><div className="how-decoration"><span /><span /><span /><HeartHandshake size={34} /></div></div>
            <div className="steps-list">
              <div className="step-row"><span className="step-number">01</span><div className="step-icon step-icon-one"><FileText size={21} /></div><div className="step-copy"><h3>Post a clear report</h3><p>Tell the community what went missing or what you found, where it happened, and when.</p><span className="step-tag"><Check size={13} /> Takes about a minute</span></div></div>
              <div className="step-row"><span className="step-number">02</span><div className="step-icon step-icon-two"><Compass size={21} /></div><div className="step-copy"><h3>Search and connect</h3><p>Browse reports, use keywords, and sign in to see the reporter’s contact instructions.</p><span className="step-tag"><Check size={13} /> Contact details protected</span></div></div>
              <div className="step-row"><span className="step-number">03</span><div className="step-icon step-icon-three"><HeartHandshake size={21} /></div><div className="step-copy"><h3>Make a happy return</h3><p>Meet safely on campus, verify the item, and mark the report resolved when it’s back home.</p><span className="step-tag"><Check size={13} /> Community-powered</span></div></div>
            </div>
          </div>
        </section>

        <section className="safety-section" id="safety"><div className="container safety-card"><div className="safety-icon"><ShieldCheck size={26} /></div><div className="safety-copy"><span className="eyebrow">A QUICK SAFETY REMINDER</span><h2>Look out for each other.</h2><p>Meet in a public campus space, confirm that the item belongs to the person claiming it, and never share sensitive card or account details in a public post.</p></div><a href="https://iub.ac.bd/" target="_blank" rel="noreferrer" className="safety-link">IUB website <ArrowRight size={16} /></a></div></section>
      </main>

      <footer className="site-footer"><div className="container footer-main"><div className="footer-brand"><span className="footer-brand-icon"><HeartHandshake size={22} /></span><div><strong>IUB Lost &amp; Found</strong><p>A little campus kindness goes a long way.</p></div></div><div className="footer-links"><a href="#board">Browse reports</a><a href="#how-it-works">How it works</a><a href="#safety">Safety</a><a href="https://iub.ac.bd/" target="_blank" rel="noreferrer">IUB website <ArrowDownRight size={14} /></a></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} IUB Lost &amp; Found · CSE309 demo project</span><span className="demo-disclaimer"><GraduationCap size={15} /> Independent student project — not an official IUB service</span></div></footer>

      {!authReady && <div className="auth-restoring"><span className="spinner" /> Restoring your session…</div>}
      {loginOpen && <LoginModal onClose={closeLogin} onSuccess={handleLoginSuccess} />}
      {reportOpen && <ReportModal key={editingItem ? `edit-${editingItem.id}` : 'create-report'} initialItem={editingItem ?? undefined} onClose={() => { setReportOpen(false); setEditingItem(null); setReportError('') }} onSubmit={handleSaveReport} busy={reportBusy} error={reportError} />}
      {detailItem && <ItemDetailsModal item={detailItem} loading={detailLoading} error={detailError} onClose={() => { setDetailItem(null); setDetailError('') }} />}
      {contactItem && <ContactModal item={contactItem} contact={contactData} loading={contactLoading} error={contactError} onClose={() => { setContactItem(null); setContactData(null); setContactError('') }} />}
      {toast && <div className="toast-message" role="status"><span><CheckCircle2 size={17} /></span>{toast}</div>}
    </div>
  )
}

export default App
