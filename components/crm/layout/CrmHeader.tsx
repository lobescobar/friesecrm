'use client';

import Image from 'next/image';
import Button from '../../ui/Button';
import ImportarERP from '../ImportarERP';
import ImportarOrcamentos from '../ImportarOrcamentos';

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
    <header className="crm-card mb-4 flex flex-col gap-5 rounded-3xl px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Image
          src="/logo.png"
          alt="Friese AgroindÃºstria"
          width={190}
          height={60}
          priority
          className="h-12 w-auto object-contain"
        />

        <div className="border-slate-200 sm:border-l sm:pl-5">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-950">
            Painel comercial
          </h1>
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        {usuarioEmail ? (
          <span className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
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



