import React from 'react'
import { format, isValid, parseISO } from 'date-fns'
import { Check, CheckCheck } from 'lucide-react'

const MessageItem = ({ message, isOwn }) => {
  
  // Safely format the time
  const formatMessageTime = (dateString) => {
    if (!dateString) return '--:--'
    
    try {
      let date
      
      // Handle different date formats
      if (typeof dateString === 'string') {
        date = parseISO(dateString)
      } else if (typeof dateString === 'number') {
        date = new Date(dateString)
      } else if (dateString instanceof Date) {
        date = dateString
      } else if (dateString?.toDate) {
        date = dateString.toDate() // For Firestore timestamps
      } else {
        date = new Date(dateString)
      }
      
      // Check if date is valid
      if (!isValid(date)) {
        console.warn('Invalid date format:', dateString)
        return '--:--'
      }
      
      return format(date, 'HH:mm')
    } catch (error) {
      console.error('Date formatting error:', error)
      return '--:--'
    }
  }

  const formattedTime = formatMessageTime(message?.createdAt)

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
          isOwn
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-gray-100 text-gray-900 rounded-bl-none'
        }`}
      >
        {message.text && (
          <p className="break-words">{message.text}</p>
        )}
        {message.image && (
          <img
            src={message.image}
            alt="Message"
            className="rounded-lg max-w-full max-h-64 object-cover mt-2"
          />
        )}
        <div className={`flex items-center justify-end mt-1 text-xs ${
          isOwn ? 'text-blue-200' : 'text-gray-500'
        }`}>
          <span className="mr-1">
            {formattedTime}
          </span>
          {isOwn && (
            <span>
              {message.status === 'read' ? (
                <CheckCheck className="w-3 h-3" />
              ) : (
                <Check className="w-3 h-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessageItem