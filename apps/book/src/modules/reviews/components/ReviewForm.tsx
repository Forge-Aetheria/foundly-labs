'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Chip, Stack, TextField, Typography } from '@foundly/ui';
import { useToast } from '../../../shared/components/Toaster';
import { useSubmitReview } from '../hooks';

const RATINGS = [1, 2, 3, 4, 5];

export interface ReviewFormProps {
  /** Public business slug the review is submitted to. */
  tenantSlug: string;
}

/**
 * Public review submission form (feature 014, US3).
 * On success it refreshes the server-rendered reviews list + rating.
 */
export function ReviewForm({ tenantSlug }: ReviewFormProps) {
  const router = useRouter();
  const toast = useToast();
  const submitReview = useSubmitReview();
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setFieldErrors(null);
    setNotice(null);
    setDone(false);
    setSubmitting(true);
    const result = await submitReview({ tenantSlug, author, rating, comment });
    setSubmitting(false);
    if (!result.ok) {
      if (result.error.fields) {
        setFieldErrors(result.error.fields);
        toast.warning('Revisa los datos de tu reseña.');
      } else {
        setNotice(result.error.message);
        toast.error(result.error.message);
      }
      return;
    }
    setAuthor('');
    setRating(5);
    setComment('');
    setDone(true);
    toast.success('¡Gracias por tu reseña!');
    router.refresh();
  }

  return (
    <Stack spacing={1.5} sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
      <Typography variant="body1" sx={{ fontWeight: 600 }}>
        Deja tu reseña
      </Typography>
      <TextField
        label="Tu nombre"
        value={author}
        onChange={(value) => setAuthor(value)}
        error={Boolean(fieldErrors?.author)}
        helperText={fieldErrors?.author}
        fullWidth
      />
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} alignItems="center">
        <Typography variant="body2" color="text.secondary">
          Valoración:
        </Typography>
        {RATINGS.map((value) => (
          <Chip
            key={value}
            label={`${value}★`}
            selectable
            selected={rating === value}
            onClick={() => setRating(value)}
          />
        ))}
      </Stack>
      <TextField
        label="Comentario"
        value={comment}
        onChange={(value) => setComment(value)}
        error={Boolean(fieldErrors?.comment)}
        helperText={fieldErrors?.comment}
        multiline
        rows={3}
        maxLength={2000}
        fullWidth
      />
      <Stack direction="row" alignItems="center" spacing={2} justifyContent="flex-end">
        {notice ? (
          <Typography variant="body2" color="error" role="alert">
            {notice}
          </Typography>
        ) : done ? (
          <Typography variant="body2" color="success.main" role="status">
            ¡Gracias por tu reseña!
          </Typography>
        ) : null}
        <Button variant="primary" onClick={submit} disabled={submitting}>
          {submitting ? 'Enviando…' : 'Enviar reseña'}
        </Button>
      </Stack>
    </Stack>
  );
}
