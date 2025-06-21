import { useState, useEffect } from "react"
import Editor from "react-simple-code-editor"
import "./TextEditor.css"

interface TextEditorProps {
  fileUrl: string
  fileName: string
  onSave: (content: string) => void
  isAuthorized: boolean
}

export default function TextEditor({ fileUrl, fileName }: TextEditorProps) {
  const [text, setText] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTextFile = async () => {
      try {
        const response = await fetch(fileUrl)
        const content = await response.text()
        setText(content)
      } catch (error) {
        console.error("Error loading text file:", error)
        setText("Error loading file content")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTextFile()
  }, [fileUrl])

  if (isLoading) {
    return <div className="text-loading">Loading...</div>
  }

  return (
    <div className="text-editor-container">
      <div className="text-editor-header">
        <h3>{fileName}</h3>
      </div>
      <div className="text-editor-content">
        <Editor
          value={text}
          onValueChange={() => {}}
          highlight={() => text}
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 14,
            backgroundColor: "var(--bg-primary)",
            color: "var(--text-primary)",
            maxHeight: "70vh",
            border: "1px solid var(--border-primary)",
            borderRadius: "4px",
            overflowY:"scroll",
          }}
          textareaClassName="text-editor-area"
        />
      </div>
    </div>
  )
}