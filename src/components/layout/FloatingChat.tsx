'use client'

import { MessageCircle, X } from 'lucide-react'
import { useState } from 'react'

export function FloatingChat() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className="floating-chat-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="Chat with us on WhatsApp"
      >
        <MessageCircle size={22} />
      </button>
      {open && (
        <div className="floating-chat-box">
          <div className="floating-chat-head">
            <strong>Need Help?</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close">
              <X size={14} />
            </button>
          </div>
          <div className="floating-chat-body">
            <p>Have a question about your order or a gift? Chat with us on WhatsApp.</p>
            <a href="https://wa.me/8801312597437" className="floating-chat-wa">
              <MessageCircle size={14} /> Chat on WhatsApp
            </a>
          </div>
        </div>
      )}
    </>
  )
}
