import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextInput from '../../components/InputPanel/TextInput';
import VoiceInput from '../../components/InputPanel/VoiceInput';

// ---------- TextInput ----------

describe('TextInput', () => {
  it('renders textarea and send button', () => {
    render(<TextInput onSend={vi.fn()} loading={false} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('calls onSend with trimmed text on Enter', async () => {
    const onSend = vi.fn();
    render(<TextInput onSend={onSend} loading={false} />);
    const ta = screen.getByRole('textbox');
    await userEvent.type(ta, 'Add an EC2 instance');
    fireEvent.keyDown(ta, { key: 'Enter', code: 'Enter', shiftKey: false });
    expect(onSend).toHaveBeenCalledWith('Add an EC2 instance');
  });

  it('does not submit empty text', async () => {
    const onSend = vi.fn();
    render(<TextInput onSend={onSend} loading={false} />);
    const ta = screen.getByRole('textbox');
    fireEvent.keyDown(ta, { key: 'Enter', code: 'Enter' });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('Shift+Enter does not submit', async () => {
    const onSend = vi.fn();
    render(<TextInput onSend={onSend} loading={false} />);
    const ta = screen.getByRole('textbox');
    await userEvent.type(ta, 'hello');
    fireEvent.keyDown(ta, { key: 'Enter', code: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('disables textarea and button when loading', () => {
    render(<TextInput onSend={vi.fn()} loading={true} />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('clears input after submit', async () => {
    render(<TextInput onSend={vi.fn()} loading={false} />);
    const ta = screen.getByRole('textbox') as HTMLTextAreaElement;
    await userEvent.type(ta, 'hello');
    fireEvent.keyDown(ta, { key: 'Enter', code: 'Enter' });
    expect(ta.value).toBe('');
  });
});

// ---------- VoiceInput ----------

describe('VoiceInput', () => {
  it('shows mic button when supported', () => {
    render(
      <VoiceInput voiceState="idle" supported={true} onStart={vi.fn()} onStop={vi.fn()} />,
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows N/A message when not supported', () => {
    render(
      <VoiceInput voiceState="idle" supported={false} onStart={vi.fn()} onStop={vi.fn()} />,
    );
    expect(screen.getByText(/voice n\/a/i)).toBeInTheDocument();
  });

  it('shows Listening text when voiceState is listening', () => {
    render(
      <VoiceInput voiceState="listening" supported={true} onStart={vi.fn()} onStop={vi.fn()} />,
    );
    expect(screen.getByText(/listening/i)).toBeInTheDocument();
  });

  it('calls onStart on mouse down', async () => {
    const onStart = vi.fn();
    render(
      <VoiceInput voiceState="idle" supported={true} onStart={onStart} onStop={vi.fn()} />,
    );
    fireEvent.mouseDown(screen.getByRole('button'));
    expect(onStart).toHaveBeenCalled();
  });

  it('calls onStop on mouse up', async () => {
    const onStop = vi.fn();
    render(
      <VoiceInput voiceState="listening" supported={true} onStart={vi.fn()} onStop={onStop} />,
    );
    fireEvent.mouseUp(screen.getByRole('button'));
    expect(onStop).toHaveBeenCalled();
  });
});
