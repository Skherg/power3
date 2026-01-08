import React, { useState } from 'react'
import { submitAccessRequest } from '../lib/api'

export default function AccessRequestForm() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    organization: '',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters except +
    const cleaned = value.replace(/[^\d+]/g, '')
    
    // If starts with +995, format as +995-XXX-XX-XX-XX
    if (cleaned.startsWith('+995')) {
      const digits = cleaned.slice(4)
      if (digits.length <= 3) return `+995-${digits}`
      if (digits.length <= 5) return `+995-${digits.slice(0, 3)}-${digits.slice(3)}`
      if (digits.length <= 7) return `+995-${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
      return `+995-${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 7)}-${digits.slice(7, 9)}`
    }
    
    // If starts with +, keep it
    if (cleaned.startsWith('+')) {
      return cleaned
    }
    
    // Format as XXX-XX-XX-XX for 9 digits
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 5) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
    if (cleaned.length <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 7)}-${cleaned.slice(7, 9)}`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    // Phone number validation and formatting
    if (name === 'phone') {
      const formattedValue = formatPhoneNumber(value)
      setFormData({
        ...formData,
        [name]: formattedValue
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate required fields
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.organization.trim()) {
      setError('გთხოვთ შეავსოთ ყველა სავალდებულო ველი')
      return
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('გთხოვთ შეიყვანოთ სწორი ელ. ფოსტა')
      return
    }

    // Validate phone number
    const digitsOnly = formData.phone.replace(/[^\d]/g, '')
    if (digitsOnly.length !== 9 && digitsOnly.length !== 12) {
      setError('ტელეფონის ნომერი უნდა შეიცავდეს 9 ან 12 ციფრს')
      return
    }

    setSubmitting(true)

    try {
      const success = await submitAccessRequest(formData)
      
      if (success) {
        setSubmitted(true)
      } else {
        setError('მოთხოვნის გაგზავნა ვერ მოხერხდა. გთხოვთ სცადოთ თავიდან.')
      }
    } catch (err) {
      console.error('Error submitting access request:', err)
      setError('მოთხოვნის გაგზავნა ვერ მოხერხდა. გთხოვთ სცადოთ თავიდან.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-teal-50 to-green-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">მოთხოვნა გაგზავნილია!</h2>
          <p className="text-slate-600 mb-6">
            თქვენი მოთხოვნა წარმატებით გაიგზავნა. ადმინისტრატორი განიხილავს მას და გამოგიგზავნით ტესტის ბმულს ელ. ფოსტაზე.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-semibold"
          >
            მთავარ გვერდზე დაბრუნება
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-teal-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <img
              src="https://i.ibb.co/bc9xNqL/pwr3-logo-tr.png"
              alt="POWER3 Logo"
              className="w-16 h-16 object-contain rounded-full"
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">მოითხოვე ტესტზე წვდომა</h1>
          <p className="text-slate-600">
            შეავსე ფორმა და ადმინისტრატორი გამოგიგზავნის ტესტის ბმულს
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-slate-700 mb-2">
                სახელი <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                placeholder="თქვენი სახელი"
              />
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-slate-700 mb-2">
                გვარი <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                placeholder="თქვენი გვარი"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              ელ. ფოსტა <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
              ტელეფონი <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              placeholder="+995-XXX-XX-XX-XX"
            />
          </div>

          <div>
            <label htmlFor="organization" className="block text-sm font-medium text-slate-700 mb-2">
              ორგანიზაცია <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="organization"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              placeholder="თქვენი ორგანიზაცია"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
              დამატებითი ინფორმაცია
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              placeholder="რატომ გსურთ ტესტის გავლა?"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => window.location.href = '/'}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-slate-700 rounded-full hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 font-semibold"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-full hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 transform hover:scale-105 font-semibold"
            >
              {submitting ? 'იგზავნება...' : 'მოთხოვნის გაგზავნა'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
