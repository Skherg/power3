import React, { useState, useEffect } from 'react'
import { Question } from '../lib/supabase'
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from '../lib/api'

interface QuestionFormData {
  id: string
  domain: string
  component: string
  text: string
  tag: string
}

const DOMAINS = ['Vision', 'People', 'Execution', 'E/I']
const COMPONENTS = {
  Vision: ['Strategic Thinking', 'Vision Articulation', 'Creativity & Innovation', 'Purpose-Driven Mindset', 'Systemic Thinking', 'Adaptive Thinking'],
  People: ['Empathy', 'Emotional Intelligence', 'Intrinsic Motivation', 'Empowering Others', 'Network Building', 'Trust-Building'],
  Execution: ['Goal Orientation', 'Decisiveness', 'Accountability', 'Prioritization', 'Operational Discipline', 'Outcome Orientation'],
  'E/I': ['Extraversion', 'Introversion']
}

export default function QuestionManager() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [formData, setFormData] = useState<QuestionFormData>({
    id: '',
    domain: 'Vision',
    component: 'Strategic Thinking',
    text: '',
    tag: ''
  })
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    setLoading(true)
    const data = await getQuestions()
    setQuestions(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingQuestion) {
      // Update existing question
      const updated = await updateQuestion(editingQuestion.id, {
        domain: formData.domain,
        component: formData.component,
        text: formData.text,
        tag: formData.tag
      })
      
      if (updated) {
        setQuestions(questions.map(q => q.id === editingQuestion.id ? updated : q))
        resetForm()
      }
    } else {
      // Create new question
      const created = await createQuestion(formData)
      
      if (created) {
        setQuestions([...questions, created])
        resetForm()
      }
    }
  }

  const handleEdit = (question: Question) => {
    setEditingQuestion(question)
    setFormData({
      id: question.id,
      domain: question.domain,
      component: question.component,
      text: question.text,
      tag: question.tag
    })
    setShowEditModal(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      const success = await deleteQuestion(id)
      if (success) {
        setQuestions(questions.filter(q => q.id !== id))
      }
    }
  }

  const handleImportQuestions = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        setImporting(true)
        const text = await file.text()
        const importedQuestions = JSON.parse(text)

        // Validate the JSON structure
        if (!Array.isArray(importedQuestions)) {
          alert('Invalid JSON format. Expected an array of questions.')
          return
        }

        // Validate each question has required fields
        const requiredFields = ['id', 'domain', 'component', 'text', 'tag']
        for (const question of importedQuestions) {
          for (const field of requiredFields) {
            if (!question[field]) {
              alert(`Invalid question format. Missing field: ${field}`)
              return
            }
          }
        }

        if (window.confirm(`This will replace all ${questions.length} existing questions with ${importedQuestions.length} imported questions. Are you sure?`)) {
          // Delete all existing questions
          for (const question of questions) {
            await deleteQuestion(question.id)
          }

          // Import new questions
          for (const question of importedQuestions) {
            await createQuestion(question)
          }

          await loadQuestions()
          alert('Questions imported successfully!')
        }
      } catch (error) {
        console.error('Error importing questions:', error)
        alert('Error importing questions. Please check the file format.')
      } finally {
        setImporting(false)
      }
    }
    input.click()
  }

  const handleExportQuestions = async () => {
    try {
      setExporting(true)
      const questionsToExport = questions.map(({ id, domain, component, text, tag }) => ({
        id,
        domain,
        component,
        text,
        tag
      }))

      const jsonString = JSON.stringify(questionsToExport, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `power3_questions_${new Date().toISOString().split('T')[0]}.json`
      link.click()
      
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting questions:', error)
      alert('Error exporting questions.')
    } finally {
      setExporting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      id: '',
      domain: 'Vision',
      component: 'Strategic Thinking',
      text: '',
      tag: ''
    })
    setEditingQuestion(null)
    setShowAddForm(false)
    setShowEditModal(false)
  }

  const groupedQuestions = questions.reduce((acc, question) => {
    if (!acc[question.domain]) {
      acc[question.domain] = {}
    }
    if (!acc[question.domain][question.component]) {
      acc[question.domain][question.component] = []
    }
    acc[question.domain][question.component].push(question)
    return acc
  }, {} as Record<string, Record<string, Question[]>>)

  if (loading) {
    return <div className="p-4">Loading questions...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Question Management</h2>
        <div className="space-x-2">
          <button
            onClick={handleExportQuestions}
            disabled={exporting}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : 'Export JSON'}
          </button>
          <button
            onClick={handleImportQuestions}
            disabled={importing}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {importing ? 'Importing...' : 'Import JSON'}
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Add Question
          </button>
        </div>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        Total Questions: {questions.length}
      </div>

      {/* Add Form */}
      {showAddForm && !editingQuestion && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">Add New Question</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Question ID</label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., V_ST_01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Domain</label>
                <select
                  value={formData.domain}
                  onChange={(e) => {
                    const domain = e.target.value as keyof typeof COMPONENTS
                    setFormData({ 
                      ...formData, 
                      domain,
                      component: COMPONENTS[domain][0]
                    })
                  }}
                  className="w-full p-2 border rounded"
                  required
                >
                  {DOMAINS.map(domain => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Component</label>
                <select
                  value={formData.component}
                  onChange={(e) => setFormData({ ...formData, component: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                >
                  {COMPONENTS[formData.domain as keyof typeof COMPONENTS].map(component => (
                    <option key={component} value={component}>{component}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tag</label>
                <input
                  type="text"
                  value={formData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., Strategic Thinking"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Question Text</label>
              <textarea
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                className="w-full p-2 border rounded h-24"
                placeholder="Enter the question text..."
                required
              />
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Question
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Question</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Question ID</label>
                  <input
                    type="text"
                    value={formData.id}
                    className="w-full p-2 border rounded bg-gray-100"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Domain</label>
                  <select
                    value={formData.domain}
                    onChange={(e) => {
                      const domain = e.target.value as keyof typeof COMPONENTS
                      setFormData({ 
                        ...formData, 
                        domain,
                        component: COMPONENTS[domain][0]
                      })
                    }}
                    className="w-full p-2 border rounded"
                    required
                  >
                    {DOMAINS.map(domain => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Component</label>
                  <select
                    value={formData.component}
                    onChange={(e) => setFormData({ ...formData, component: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  >
                    {COMPONENTS[formData.domain as keyof typeof COMPONENTS].map(component => (
                      <option key={component} value={component}>{component}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tag</label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., Strategic Thinking"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Question Text</label>
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  className="w-full p-2 border rounded h-32"
                  placeholder="Enter the question text..."
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Update Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        {Object.entries(groupedQuestions).map(([domain, components]) => (
          <div key={domain} className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4 text-blue-600">{domain} Domain</h3>
            {Object.entries(components).map(([component, componentQuestions]) => (
              <div key={component} className="mb-4">
                <h4 className="text-lg font-medium mb-2 text-gray-700">{component}</h4>
                <div className="space-y-2">
                  {componentQuestions.map((question) => (
                    <div key={question.id} className="flex items-start justify-between p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="font-mono text-sm text-gray-500 mb-1">{question.id}</div>
                        <div className="text-sm">{question.text}</div>
                        <div className="text-xs text-gray-500 mt-1">Tag: {question.tag}</div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(question)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(question.id)}
                          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}