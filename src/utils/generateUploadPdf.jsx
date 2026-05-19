import { createRoot } from 'react-dom/client';
import { toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import axios from '../api/axios';
import InvoicePrintView from '../components/InvoicePrintView';

const fetchImageAsBase64 = async (url) => {
  try {
    console.log("📥 Downloading signature from MinIO:", url);
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error("MinIO returned " + response.status);
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log("✅ Signature converted to Base64 successfully!");
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error_) {
    console.error("❌ Failed to download signature:", error_);
    return null;
  }
};

export const generateAndUploadFrontendPDF = async (invoice, booking) => {
  try {
    console.log("🚀 Starting PDF Generation...");

    // 1. PRE-FETCH THE SIGNATURE (Now outside the Promise block)
    let safeSignatureData = null;
    if (invoice?.adminSignatureUrl) {
      safeSignatureData = await fetchImageAsBase64(invoice.adminSignatureUrl);
    } else {
      console.warn("⚠️ No adminSignatureUrl found in the invoice data!");
    }

    const finalInvoiceData = {
      ...invoice,
      adminSignatureUrl: safeSignatureData || invoice?.adminSignatureUrl
    };

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '-9999px';
    container.style.width = '800px'; 
    container.style.backgroundColor = '#ffffff'; 
    document.body.appendChild(container);

    // 2. Render the invoice component
    const root = createRoot(container);
    root.render(
      <InvoicePrintView invoice={finalInvoiceData} booking={booking} onClose={() => {}} />
    );

    // 3. Return a clean, non-async Promise executor for the timeout phase
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const element = document.getElementById('printable-invoice-area');
          if (!element) throw new Error("Invoice element not found in DOM");

          // Force centering
          element.classList.remove('m-4'); 
          element.style.margin = '0 auto'; 
          element.style.padding = '20px';  
          element.style.width = '100%';

          console.log("📸 Snapping picture of the invoice...");
          const imgData = await toJpeg(element, { 
            pixelRatio: 1.5,
            quality: 0.95,
            backgroundColor: '#ffffff',
            style: { transform: 'scale(1)', transformOrigin: 'top left' }
          });
          
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const imgProps = pdf.getImageProperties(imgData);
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          const pdfBlob = pdf.output('blob');
          const file = new File([pdfBlob], `${finalInvoiceData.invoiceNumber}.pdf`, { type: 'application/pdf' });

          const formData = new FormData();
          formData.append('invoicePdf', file); 
          
          console.log("☁️ Uploading to Backend...");
          await axios.patch(`/billing/${finalInvoiceData.id}/upload-pdf`, formData);

          console.log("🎉 PDF successfully uploaded!");
          resolve(true);
        } catch (error_) {
          console.error("❌ PDF Snapshot or Upload Failed:", error_);
          reject(error_);
        } finally {
          root.unmount();
          container.remove(); // FIX: Prefer childNode.remove()
        }
      }, 1500); 
    });

  } catch (error_) { // FIX: Renamed globalErr to error_
    console.error("❌ Global PDF Generator Error:", error_);
    throw error_;
  }
};