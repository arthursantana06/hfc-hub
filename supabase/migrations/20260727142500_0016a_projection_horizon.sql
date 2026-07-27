-- HFC Hub — Fase 1 · P1 · Horizonte de aposentadoria
--
-- `ALTER TYPE ... ADD VALUE` fica sozinho numa migração: o novo rótulo só pode
-- ser usado depois que a transação que o criou fecha, então misturá-lo com o
-- DDL que o consome falha.

alter type public.projection_horizon add value if not exists 'aposentadoria';
