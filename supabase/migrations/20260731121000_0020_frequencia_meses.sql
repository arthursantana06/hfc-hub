-- HFC Hub — Fase 2 · P2 · Frequência "meses escolhidos"
--
-- Nem toda despesa é mensal ou anual. O IPVA é anual mas o cliente o paga em
-- três parcelas em janeiro, fevereiro e março; a escola cobra material em
-- fevereiro e agosto. Guardar isso como "anual dividido por 12" mente sobre o
-- caixa dos meses em que a parcela de fato sai.
--
-- `ALTER TYPE ... ADD VALUE` fica sozinho numa migração: o novo rótulo só pode
-- ser usado depois que a transação que o criou fecha (mesmo motivo do 0016a).

alter type public.entry_frequency add value if not exists 'meses';
