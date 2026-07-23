type DestinatarioGraph = {
  emailAddress: {
    address: string;
  };
};

function lerVariavelObrigatoria(nome: string) {
  const valor = process.env[nome]?.trim();

  if (!valor) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${nome}.`);
  }

  return valor;
}

async function obterTokenMicrosoftGraph() {
  const tenantId = lerVariavelObrigatoria('MICROSOFT_TENANT_ID');
  const clientId = lerVariavelObrigatoria('MICROSOFT_CLIENT_ID');
  const clientSecret = lerVariavelObrigatoria('MICROSOFT_CLIENT_SECRET');

  const corpo = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });

  const resposta = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(
      tenantId
    )}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: corpo,
      cache: 'no-store'
    }
  );

  const dados = (await resposta.json()) as {
    access_token?: string;
    error_description?: string;
  };

  if (!resposta.ok || !dados.access_token) {
    throw new Error(
      dados.error_description ||
        'Não foi possível autenticar o aplicativo no Microsoft 365.'
    );
  }

  return dados.access_token;
}

export async function enviarEmailMicrosoft365(params: {
  destinatarios: string[];
  assunto: string;
  corpo: string;
}) {
  const remetente = lerVariavelObrigatoria('MICROSOFT_MAIL_SENDER');
  const token = await obterTokenMicrosoftGraph();

  const destinatarios = Array.from(
    new Set(
      params.destinatarios
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    )
  );

  if (destinatarios.length === 0) {
    throw new Error('Nenhum destinatário válido foi informado.');
  }

  const toRecipients: DestinatarioGraph[] = destinatarios.map((address) => ({
    emailAddress: { address }
  }));

  const resposta = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
      remetente
    )}/sendMail`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          subject: params.assunto,
          body: {
            contentType: 'Text',
            content: params.corpo
          },
          toRecipients
        },
        saveToSentItems: true
      }),
      cache: 'no-store'
    }
  );

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    throw new Error(
      `Microsoft Graph recusou o envio (${resposta.status}). ${detalhe}`.trim()
    );
  }

  return {
    remetente,
    destinatarios
  };
}
