import jsPDF from 'jspdf';

interface CommissionData {
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  listingPrice: number;
  purchasePrice: number;
  buyerName: string;
  sellerName: string;
  commission: number; // Commission amount in dollars
  commissionRate?: number | null; // Optional: percentage used if slider was enabled
  fees: Array<{ type: string; amount: number }>;
  agentName: string;
  date: string;
  transactionType?: 'sale' | 'rental'; // Optional, defaults to 'sale'
}

export async function generateCommissionStatement(data: CommissionData) {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = 20;

  // Header - Reapex Logo (compressed)
  try {
    const logoResponse = await fetch('/logos/layer-1-copy.png');
    const logoBlob = await logoResponse.blob();

    // Compress the image using canvas
    const compressedBase64 = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onloadend = () => {
        img.src = reader.result as string;
      };

      img.onload = () => {
        // Create canvas with smaller dimensions for compression
        const canvas = document.createElement('canvas');
        const maxWidth = 400; // Reduced from original size
        const maxHeight = 80;

        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with quality compression (70% quality)
        const compressed = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressed);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      reader.readAsDataURL(logoBlob);
    });

    // Add compressed logo centered at top
    const logoWidth = 60;
    const logoHeight = 12;
    doc.addImage(compressedBase64, 'JPEG', (pageWidth - logoWidth) / 2, yPos, logoWidth, logoHeight);
    yPos += logoHeight + 10;
  } catch (error) {
    // Fallback to text if logo fails to load
    console.error('Logo compression failed:', error);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('reapex', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
  }

  // Document Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('COMMISSION STATEMENT', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Line separator
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${data.date}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 15;

  // Property Information Section
  const isRentalTx = data.transactionType === 'rental';

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPERTY INFORMATION', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Address: ${data.propertyAddress}`, margin, yPos);
  yPos += 6;
  doc.text(`City, State: ${data.propertyCity}, ${data.propertyState}`, margin, yPos);
  yPos += 6;
  doc.text(`Listing Price: $${(data.listingPrice || 0).toLocaleString()}`, margin, yPos);
  yPos += 6;

  // Conditional label for purchase/rent price
  const priceLabel = isRentalTx ? 'Rent Price' : 'Purchase Price';
  doc.text(`${priceLabel}: $${(data.purchasePrice || 0).toLocaleString()}`, margin, yPos);
  yPos += 6;

  // Conditional labels for buyer/seller names
  const buyerLabel = isRentalTx ? 'Tenant Name' : 'Buyer Name';
  const sellerLabel = isRentalTx ? 'Landlord Name' : 'Seller Name';

  if (data.buyerName) {
    doc.text(`${buyerLabel}: ${data.buyerName}`, margin, yPos);
    yPos += 6;
  }

  if (data.sellerName) {
    doc.text(`${sellerLabel}: ${data.sellerName}`, margin, yPos);
    yPos += 6;
  }

  yPos += 9;

  // Professional Services Statement
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const serviceText = 'For professional services rendered in the above captured property, the following fees are due and payable to Reapex.';
  const splitServiceText = doc.splitTextToSize(serviceText, contentWidth);
  doc.text(splitServiceText, margin, yPos);
  yPos += splitServiceText.length * 5 + 10;

  // Commission Calculation Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('COMMISSION BREAKDOWN', margin, yPos);
  yPos += 8;

  // Use the commission amount directly from the form
  const commission = data.commission || 0;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  if (isRentalTx) {
    // Rental template - show rental amount
    doc.text(`Monthly Rent:`, margin, yPos);
    doc.text(`$${(data.purchasePrice || 0).toLocaleString()}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;

    doc.text(`Commission Amount:`, margin, yPos);
    doc.text(`$${commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;
  } else {
    // Sale template
    doc.text(`Purchase Price:`, margin, yPos);
    doc.text(`$${(data.purchasePrice || 0).toLocaleString()}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;

    // Show commission rate only if it was calculated with slider
    if (data.commissionRate !== null && data.commissionRate !== undefined) {
      doc.text(`Commission Rate:`, margin, yPos);
      doc.text(`${data.commissionRate.toFixed(1)}%`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 6;
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.text(`Gross Commission:`, margin, yPos);
  doc.text(`$${commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 10;

  // Fees Section
  if (data.fees.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('FEES & DEDUCTIONS', margin, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    let totalFees = 0;

    data.fees.forEach(fee => {
      const feeLabel = fee.type
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      doc.text(`${feeLabel}:`, margin, yPos);
      doc.text(`$${(fee.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin, yPos, { align: 'right' });
      totalFees += (fee.amount || 0);
      yPos += 6;
    });

    yPos += 4;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Fees:`, margin, yPos);
    doc.text(`$${totalFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 10;
  }

  // Line separator
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Net Commission
  const totalFees = data.fees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
  const netCommission = commission - totalFees;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('NET COMMISSION:', margin, yPos);
  doc.text(`$${netCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 20;

  // Payment Instructions
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment to be made payable to:', margin, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text('Reapex', margin, yPos);
  yPos += 5;
  doc.text('260 Columbia Ave, Suite 20', margin, yPos);
  yPos += 5;
  doc.text('Fort Lee, NJ 07024', margin, yPos);

  // Generate filename
  const fileName = `Commission_Statement_${data.propertyAddress.replace(/[^a-zA-Z0-9]/g, '_')}_${data.date.replace(/\//g, '-')}.pdf`;

  // Save the PDF for download
  doc.save(fileName);

  // Return the PDF blob for upload
  const pdfBlob = doc.output('blob');
  return { blob: pdfBlob, fileName };
}
