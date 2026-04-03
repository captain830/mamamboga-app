import React from 'react'
import { FileText, FileSpreadsheet } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const ExportReport = ({ data, type, filename }) => {
  
  const exportToCSV = () => {
    if (!data || data.length === 0) {
      toast.error('No data to export')
      return
    }
    
    // Convert data to CSV
    const headers = Object.keys(data[0])
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ]
    
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success('CSV exported successfully!')
  }
  
  const exportToPDF = () => {
    if (!data || data.length === 0) {
      toast.error('No data to export')
      return
    }
    
    try {
      // Create new PDF document
      const doc = new jsPDF('landscape')
      
      // Add title
      doc.setFontSize(20)
      doc.setTextColor(46, 125, 50) // Green color
      doc.text(`${filename.replace(/_/g, ' ').toUpperCase()} Report`, 14, 20)
      
      // Add date
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)
      
      // Prepare table data
      const headers = Object.keys(data[0]).map(key => ({
        header: key.replace(/_/g, ' ').toUpperCase(),
        dataKey: key
      }))
      
      const tableData = data.map(row => {
        return headers.map(h => {
          let value = row[h.dataKey]
          if (h.dataKey.includes('amount') || h.dataKey.includes('price') || h.dataKey.includes('revenue')) {
            value = `KSh ${value?.toLocaleString() || 0}`
          } else if (h.dataKey.includes('date') && value) {
            value = new Date(value).toLocaleDateString()
          }
          return value || ''
        })
      })
      
      // Add table to PDF
      autoTable(doc, {
        head: [headers.map(h => h.header)],
        body: tableData,
        startY: 40,
        theme: 'striped',
        headStyles: {
          fillColor: [46, 125, 50],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [240, 248, 240]
        },
        margin: { top: 40, left: 14, right: 14 },
        styles: {
          fontSize: 8,
          cellPadding: 3
        }
      })
      
      // Save the PDF
      doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF exported successfully!')
      
    } catch (error) {
      console.error('PDF export error:', error)
      toast.error('Failed to generate PDF. Trying alternative method...')
      
      // Fallback: Print version
      const printWindow = window.open('', '_blank')
      printWindow.document.write(`
        <html>
          <head>
            <title>${filename} Report</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #2e7d32; }
              .date { color: #666; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #2e7d32; color: white; }
              tr:nth-child(even) { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>${filename.replace(/_/g, ' ').toUpperCase()} Report</h1>
            <p class="date">Generated on: ${new Date().toLocaleString()}</p>
            <table>
              <thead>
                <tr>
                  ${Object.keys(data[0]).map(key => `<th>${key.replace(/_/g, ' ').toUpperCase()}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${data.map(row => `
                  <tr>
                    ${Object.values(row).map(value => `<td>${value || ''}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
      toast.success('PDF opened in print preview')
    }
  }
  
  return (
    <div className="flex gap-2">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={exportToCSV}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
      >
        <FileSpreadsheet size={18} />
        Export CSV
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={exportToPDF}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        <FileText size={18} />
        Export PDF
      </motion.button>
    </div>
  )
}

export default ExportReport