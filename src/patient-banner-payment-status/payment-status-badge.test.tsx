import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PaymentStatusBadge from './payment-status-badge.component';
import { useBills } from '../billing.resource';

jest.mock('../billing.resource', () => ({
  useBills: jest.fn(),
}));

jest.mock('@openmrs/esm-framework', () => ({
  useConfig: jest.fn().mockReturnValue({ defaultCurrency: 'USD' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue: string) => defaultValue || key,
  }),
}));

const mockUseBills = useBills as jest.Mock;

describe('PaymentStatusBadge', () => {
  const patientUuid = 'prob-patient-uuid';

  it('does not render when loading', () => {
    mockUseBills.mockReturnValue({ bills: [], isLoading: true });
    const { container } = render(<PaymentStatusBadge patientUuid={patientUuid} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does not render when there are no bills', () => {
    mockUseBills.mockReturnValue({ bills: [], isLoading: false });
    const { container } = render(<PaymentStatusBadge patientUuid={patientUuid} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders PAID status when full payment is received', () => {
    mockUseBills.mockReturnValue({
      bills: [
        { uuid: '1', totalAmount: 100, tenderedAmount: 100, status: 'PAID' },
        { uuid: '2', totalAmount: 50, tenderedAmount: 50, status: 'PAID' },
      ],
      isLoading: false,
    });
    render(<PaymentStatusBadge patientUuid={patientUuid} />);

    const badge = screen.getByText('Paid');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('cds--tag--green');
  });

  it('renders UNPAID status when no payment is received', () => {
    mockUseBills.mockReturnValue({
      bills: [{ uuid: '1', totalAmount: 100, tenderedAmount: 0, status: 'UNPAID' }],
      isLoading: false,
    });
    render(<PaymentStatusBadge patientUuid={patientUuid} />);
    const badge = screen.getByText('Unpaid');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('cds--tag--red');
  });

  it('renders PARTIALLY_PAID status when some payment is received', () => {
    mockUseBills.mockReturnValue({
      bills: [{ uuid: '1', totalAmount: 100, tenderedAmount: 50, status: 'PARTIALLY_PAID' }],
      isLoading: false,
    });
    render(<PaymentStatusBadge patientUuid={patientUuid} />);
    const badge = screen.getByText('Partially Paid');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('cds--tag--yellow');
  });

  it('opens modal when badge is clicked', () => {
    mockUseBills.mockReturnValue({
      bills: [
        {
          uuid: '1',
          totalAmount: 100,
          tenderedAmount: 100,
          status: 'PAID',
          dateCreated: '2023-01-01',
          receiptNumber: 'INV-001',
        },
      ],
      isLoading: false,
    });
    render(<PaymentStatusBadge patientUuid={patientUuid} />);
    const badge = screen.getByText('Paid');
    fireEvent.click(badge);
    expect(screen.getByText('Payment Status Details')).toBeInTheDocument();
    expect(screen.getByText('INV-001')).toBeInTheDocument();
  });
});
