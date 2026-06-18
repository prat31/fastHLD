import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextInput from '../../components/InputPanel/TextInput';
import VoiceInput from '../../components/InputPanel/VoiceInput';

// ---------- TextInput ----------
// TextInput is controlled; wrap it with local state to exercise typing/submit.

function Controlled({ onSubmit, loading = false }: { onSubmit: (v: string) => void; loading?: boolean }) {
  const [value, setValue] = useState('');
  return (
    <TextInput
      value={value}
      onChange={setValue}
      onSubmit={() => { onSubmit(value); setValue(''); }}
      loading={loading}
    />
  );
}

describe('TextInput', () => {
  it('renders textarea and send button', () => {
    render(<Controlled onSubmit={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('calls onSubmit with the current text on Enter', async () => {
    const onSubmit = vi.fn();
    render(<Controlled onSubmit={onSubmit} />);
    const ta = screen.getByRole('textbox');
    await userEvent.type(ta, 'Add an EC2 instance');
    fireEvent.keyDown(ta, { key: 'Enter', code: 'Enter', shiftKey: false });
    expect(onSubmit).toHaveBeenCalledWith('Add an EC2 instance');
  });

  it('Shift+Enter does not submit', async () => {
    const onSubmit = vi.fn();
    render(<Controlled onSubmit={onSubmit} />);
    const ta = screen.getByRole('textbox');
    await userEvent.type(ta, 'hello');
    fireEvent.keyDown(ta, { key: 'Enter', code: 'Enter', shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('send button is disabled when empty and enabled with text', async () => {
    render(<Controlled onSubmit={vi.fn()} />);
    const button = screen.getByRole('button', { name: /send/i });
    expect(button).toBeDisabled();
    await userEvent.type(screen.getByRole('textbox'), 'hi');
    expect(button).toBeEnabled();
  });

  it('disables textarea and button when loading', () => {
    render(
      <TextInput value="" onChange={vi.fn()} onSubmit={vi.fn()} loading={true} />,
    );
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('clears input after submit', async () => {
    render(<Controlled onSubmit={vi.fn()} />);
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
      <VoiceInput voiceState="idle" supported={true} mode="browser" onStart={vi.fn()} onStop={vi.fn()} />,
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows N/A message when not supported', () => {
    render(
      <VoiceInput voiceState="idle" supported={false} mode="browser" onStart={vi.fn()} onStop={vi.fn()} />,
    );
    expect(screen.getByText(/voice n\/a/i)).toBeInTheDocument();
  });

  it('shows Listening text when voiceState is listening', () => {
    render(
      <VoiceInput voiceState="listening" supported={true} mode="browser" onStart={vi.fn()} onStop={vi.fn()} />,
    );
    expect(screen.getByText(/listening/i)).toBeInTheDocument();
  });

  it('calls onStart on pointer down', () => {
    const onStart = vi.fn();
    render(
      <VoiceInput voiceState="idle" supported={true} mode="browser" onStart={onStart} onStop={vi.fn()} />,
    );
    fireEvent.pointerDown(screen.getByRole('button'));
    expect(onStart).toHaveBeenCalled();
  });

  it('calls onStop after the pointer is released anywhere', () => {
    const onStop = vi.fn();
    render(
      <VoiceInput voiceState="listening" supported={true} mode="browser" onStart={vi.fn()} onStop={onStop} />,
    );
    fireEvent.pointerDown(screen.getByRole('button'));
    fireEvent.pointerUp(window);
    expect(onStop).toHaveBeenCalled();
  });
});
