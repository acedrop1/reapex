import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '@/app/(dashboard)/admin/commission-payouts/page';
// import { UserOptions } from 'jspdf-autotable';

// Local Fee interface matching usage in this file
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface LocalFee {
    name: string;
    amount: number;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    });
};

export const generatePayoutPDF = async (transaction: Transaction): Promise<Blob> => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;

    // Load Logo
    // Note: In a real environment, you might need to convert the image to base64 or fetch it.
    // Assuming the public URL is accessible or we can use a placeholder for now if fetch fails.
    // For client-side generation, an image object or base64 string is often best.
    // We will attempt to load it from the public directory.
    const logoUrl = '/logos/layer-1-copy.png';
    try {
        const img = new Image();
        img.src = logoUrl;
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });
        // Add logo (adjust dimensions as needed)
        // Aspect ratio of Reapex logo seems to be roughly 2:1 or 3:1 based on typical logos
        doc.addImage(img, 'PNG', margin, 15, 40, 0, undefined, 'FAST'); // 0 height maintains aspect ratio, FAST compression
    } catch (e) {
        console.error("Could not load logo", e);
        // Fallback text if logo fails
        doc.setFontSize(20);
        doc.text('REAPEX', margin, 25);
    }

    // Title
    doc.setFontSize(18);
    doc.text('Commission Payout Statement', pageWidth - margin, 25, { align: 'right' });

    // Header Line with refined styling
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 40, pageWidth - margin, 40);

    // Agent & Property Details
    let yPos = 55;
    const leftColX = margin;
    const rightColX = pageWidth / 2 + 10;

    // Helper for key-value pairs
    const addDetail = (label: string, value: string, x: number, y: number) => {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(label, x, y);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text(value, x, y + 5);
    };

    addDetail('Date of Payout', formatDate(transaction.approved_at || new Date().toISOString()), leftColX, yPos);

    yPos += 15;

    addDetail('Agent Name', transaction.users.full_name || '', leftColX, yPos);

    yPos += 20;

    // Transaction Info
    doc.setFontSize(14);
    doc.text('Transaction Details', leftColX, yPos);
    yPos += 10;

    const fullAddress = `${transaction.property_address}, ${transaction.property_city}, ${transaction.property_state} ${transaction.property_zip || ''}`;
    addDetail('Property Address', fullAddress, leftColX, yPos);

    yPos += 15;

    addDetail('Closing Date', formatDate(transaction.closing_date), leftColX, yPos);
    addDetail('Transaction Type', transaction.transaction_type.toUpperCase(), rightColX, yPos);

    yPos += 20;

    // Financials Table
    const tableBody = [];

    // 1. Gross Commission Income
    tableBody.push([
        'Gross Commission Income (GCI)',
        formatCurrency(transaction.final_commission_amount || transaction.gci || 0)
    ]);

    // 2. Agent Split
    const splitPercentage = transaction.brokerage_split_percentage || transaction.agent_split_percentage;
    if (splitPercentage) {
        const gciAmount = transaction.final_commission_amount || transaction.gci || 0;
        const splitAmount = gciAmount * (splitPercentage / 100);
        tableBody.push([
            `Agent Commission (${splitPercentage}%)`,
            formatCurrency(splitAmount)
        ]);
    }

    // 3. Deductions Section Header
    if (transaction.brokerage_fees && transaction.brokerage_fees.length > 0) {
        tableBody.push([
            { content: 'Deductions', colSpan: 2, styles: { fontStyle: 'bold' as const, fillColor: [250, 250, 250], textColor: [0, 0, 0] } }
        ]);

        // Add each fee as a deduction
        // @ts-expect-error - jspdf-autotable types might not match exactly
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transaction.brokerage_fees.forEach((fee: any) => {
            const feeName = fee.name || fee.category || 'Fee';
            tableBody.push([
                `  ${feeName}`,
                `-${formatCurrency(fee.amount)}`
            ]);
        });
    }

    // Using autoTable for the structure (no header row)
    autoTable(doc, {
        startY: yPos,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: tableBody as any[],
        theme: 'plain',
        styles: {
            fontSize: 11,
            cellPadding: 5,
        },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 60, halign: 'right', fontStyle: 'bold' }
        },
        foot: [
            ['Net Payout', formatCurrency(transaction.agent_net_payout || 0)]
        ],
        footStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            fontSize: 13,
            lineWidth: 0.5,
            lineColor: [200, 200, 200]
        }
    });

    // Notes Section
    if (transaction.payout_notes) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(12);
        doc.text('Notes:', margin, finalY);
        doc.setFontSize(10);
        doc.text(transaction.payout_notes, margin, finalY + 7, { maxWidth: pageWidth - (margin * 2) });
    }

    return doc.output('blob');
};
