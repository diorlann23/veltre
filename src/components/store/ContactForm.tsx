'use client'

import { useState, type FormEvent } from 'react'
import { MessageCircle } from 'lucide-react'
import { useSession, useSettings } from '@/components/providers/AppProviders'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { whatsappUrl } from '@/lib/whatsapp'

export function ContactForm() {
  const settings = useSettings()
  const { user } = useSession()
  const [name, setName] = useState(user?.name ?? '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string>()

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (message.trim().length < 2) return setError('Please write a short message.')
    setError(undefined)
    const text = `Hello ${settings.brandName}${name.trim() ? `, this is ${name.trim()}` : ''}.\n\n${message.trim()}`
    const win = window.open(whatsappUrl(settings.whatsappNumber, text), '_blank')
    if (win) win.opener = null
  }

  return (
    <div className="card p-6 sm:p-10">
      <h2 id="message-title" className="font-display text-2xl font-semibold tracking-tight">Send us a message</h2>
      <p className="mt-2 text-sm text-mute">This opens WhatsApp with your message ready to send.</p>
      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-6">
        <Field id="contact-name" label="Your name" optional>
          {(a) => <input {...a} type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="field" />}
        </Field>
        <Field id="contact-message" label="Message" error={error}>
          {(a) => (
            <textarea
              {...a}
              rows={5}
              maxLength={1000}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                if (error) setError(undefined)
              }}
              className="field min-h-32 resize-y"
            />
          )}
        </Field>
        <Button type="submit" variant="whatsapp" size="lg" fullWidth>
          <MessageCircle className="size-4" aria-hidden="true" /> Message on WhatsApp
        </Button>
      </form>
    </div>
  )
}
