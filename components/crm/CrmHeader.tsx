'use client';

import Image from 'next/image';
import Button from '../ui/Button';
import ImportarERP from './ImportarERP';
import ImportarOrcamentos from './ImportarOrcamentos';

type CrmHeaderProps = {
  isAdmin: boolean;
  usuarioEmail?: string | null;
  onImportacaoSucesso: () => void;
  onImportacaoOrcamentosSucesso?: () => void;
  onSair: () => void;
};

export default function CrmHeader({
  isAdmin,
  usuarioEmail,
  onImportacaoSucesso,
  onImportacaoOrcamentosSucesso,
  onSair
}: CrmHeaderProps) {
  return (
    <header className="mb-4 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <Image
          src="/logo.png"
          alt="Logo da empresa"
          width={180}
          height={56}
          priority
          className="h-12 w-auto object-contain"
        />

        <div className="hidden border-l border-slate-200 pl-4 md:block">
          <h1 className="text-lg font-bold text-slate-900">
            Painel de Gestão Comercial
          </h1>
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        {usuarioEmail ? (
          <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
            {usuarioEmail}
          </span>
        ) : null}

        {isAdmin ? (
          <>
            <ImportarERP onSucesso={onImportacaoSucesso} />
            <ImportarOrcamentos onSucesso={onImportacaoOrcamentosSucesso} />
          </>
        ) : null}

        <Button type="button" variant="secondary" onClick={onSair}>
          Sair
        </Button>
      </div>
    </header>
  );
}
