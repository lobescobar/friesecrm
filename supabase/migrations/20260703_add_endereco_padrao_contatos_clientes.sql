-- Etapa 4A.2.9
-- Adiciona campo seguro para marcar qual contato/endereço é o endereço padrão de visita do cliente.
-- Não apaga dados e não altera registros existentes além do valor padrão false.

ALTER TABLE public.contatos_clientes
ADD COLUMN IF NOT EXISTS endereco_padrao boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.contatos_clientes.endereco_padrao IS
'Indica se este contato/endereço de visita é o endereço padrão do cliente no CRM.';
