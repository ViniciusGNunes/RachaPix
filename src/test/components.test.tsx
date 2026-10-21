import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Money } from '@/components/ui/Money';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toaster, toast } from '@/components/ui/Toast';

describe('UI Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Money component', () => {
    it('renders currency symbol and formatted numbers correctly', () => {
      const { container } = render(<Money value={1250.75} />);
      expect(container.textContent).toContain('R$');
      expect(container.textContent).toContain('1.250');
      expect(container.textContent).toContain(',75');
    });

    it('renders sign and positive tone when signed={true} and value > 0', () => {
      const { container } = render(<Money value={50} signed />);
      expect(container.textContent).toContain('+');
      expect(container.querySelector('.text-emerald-400')).toBeInTheDocument();
    });

    it('renders negative sign and negative tone when signed={true} and value < 0', () => {
      const { container } = render(<Money value={-35.2} signed />);
      expect(container.textContent).toContain('−');
      expect(container.querySelector('.text-rose-400')).toBeInTheDocument();
    });
  });

  describe('Badge component', () => {
    it('renders custom children and applies variant class', () => {
      render(
        <Badge variant="emerald" className="custom-class">
          Confirmado
        </Badge>
      );
      const badge = screen.getByText('Confirmado');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('custom-class');
    });

    it('renders default semantic labels when children is omitted', () => {
      const { unmount: u1 } = render(<Badge variant="paid" />);
      expect(screen.getByText('Pago')).toBeInTheDocument();
      u1();

      const { unmount: u2 } = render(<Badge variant="pending" />);
      expect(screen.getByText('Pendente')).toBeInTheDocument();
      u2();

      render(<Badge variant="overdue" />);
      expect(screen.getByText('Em atraso')).toBeInTheDocument();
    });

    it('renders leading dot indicator when dot={true}', () => {
      const { container } = render(<Badge variant="paid" dot />);
      const dot = container.querySelector('span[aria-hidden="true"]');
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass('rounded-full');
    });
  });

  describe('Modal component', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <Modal isOpen={false} onClose={() => {}} title="Título do Modal">
          <p>Conteúdo do modal</p>
        </Modal>
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('renders title, description and children when isOpen is true', () => {
      render(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Novo Membro"
          description="Preencha os dados abaixo"
        >
          <div data-testid="modal-body">Formulário</div>
        </Modal>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Novo Membro')).toBeInTheDocument();
      expect(screen.getByText('Preencha os dados abaixo')).toBeInTheDocument();
      expect(screen.getByTestId('modal-body')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Fechar Teste">
          <p>Conteúdo</p>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Fechar modal');
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Escape Teste">
          <p>Conteúdo</p>
        </Modal>
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Toast component', () => {
    it('renders toaster and displays toast messages when triggered', () => {
      render(<Toaster />);

      act(() => {
        toast.success('Despesa criada com sucesso!');
      });

      expect(screen.getByText('Despesa criada com sucesso!')).toBeInTheDocument();

      act(() => {
        toast.error('Erro ao salvar dados');
      });

      expect(screen.getByText('Erro ao salvar dados')).toBeInTheDocument();
    });

    it('dismisses toast when clicked', () => {
      render(<Toaster />);

      act(() => {
        toast.info('Mensagem temporária');
      });

      const toastButton = screen.getByText('Mensagem temporária').closest('button');
      expect(toastButton).toBeInTheDocument();

      if (toastButton) {
        fireEvent.click(toastButton);
      }

      expect(screen.queryByText('Mensagem temporária')).not.toBeInTheDocument();
    });
  });
});
