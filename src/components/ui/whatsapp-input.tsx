import { forwardRef, useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";

const COUNTRIES = [
  { code: "55", flagCode: "br", name: "Brasil", format: true, maxDigits: 13 },
  { code: "27", flagCode: "za", name: "África do Sul", format: false, maxDigits: 11 },
  { code: "49", flagCode: "de", name: "Alemanha", format: false, maxDigits: 13 },
  { code: "966", flagCode: "sa", name: "Arábia Saudita", format: false, maxDigits: 12 },
  { code: "54", flagCode: "ar", name: "Argentina", format: false, maxDigits: 13 },
  { code: "61", flagCode: "au", name: "Austrália", format: false, maxDigits: 11 },
  { code: "43", flagCode: "at", name: "Áustria", format: false, maxDigits: 13 },
  { code: "32", flagCode: "be", name: "Bélgica", format: false, maxDigits: 11 },
  { code: "591", flagCode: "bo", name: "Bolívia", format: false, maxDigits: 11 },
  { code: "974", flagCode: "qa", name: "Catar", format: false, maxDigits: 11 },
  { code: "56", flagCode: "cl", name: "Chile", format: false, maxDigits: 12 },
  { code: "86", flagCode: "cn", name: "China", format: false, maxDigits: 13 },
  { code: "57", flagCode: "co", name: "Colômbia", format: false, maxDigits: 12 },
  { code: "82", flagCode: "kr", name: "Coreia do Sul", format: false, maxDigits: 12 },
  { code: "506", flagCode: "cr", name: "Costa Rica", format: false, maxDigits: 11 },
  { code: "53", flagCode: "cu", name: "Cuba", format: false, maxDigits: 10 },
  { code: "45", flagCode: "dk", name: "Dinamarca", format: false, maxDigits: 10 },
  { code: "20", flagCode: "eg", name: "Egito", format: false, maxDigits: 12 },
  { code: "971", flagCode: "ae", name: "Emirados Árabes", format: false, maxDigits: 12 },
  { code: "593", flagCode: "ec", name: "Equador", format: false, maxDigits: 12 },
  { code: "34", flagCode: "es", name: "Espanha", format: false, maxDigits: 11 },
  { code: "1", flagCode: "us", name: "Estados Unidos", format: false, maxDigits: 11 },
  { code: "63", flagCode: "ph", name: "Filipinas", format: false, maxDigits: 12 },
  { code: "358", flagCode: "fi", name: "Finlândia", format: false, maxDigits: 12 },
  { code: "33", flagCode: "fr", name: "França", format: false, maxDigits: 11 },
  { code: "30", flagCode: "gr", name: "Grécia", format: false, maxDigits: 12 },
  { code: "31", flagCode: "nl", name: "Holanda", format: false, maxDigits: 11 },
  { code: "36", flagCode: "hu", name: "Hungria", format: false, maxDigits: 11 },
  { code: "91", flagCode: "in", name: "Índia", format: false, maxDigits: 12 },
  { code: "62", flagCode: "id", name: "Indonésia", format: false, maxDigits: 13 },
  { code: "353", flagCode: "ie", name: "Irlanda", format: false, maxDigits: 11 },
  { code: "972", flagCode: "il", name: "Israel", format: false, maxDigits: 12 },
  { code: "39", flagCode: "it", name: "Itália", format: false, maxDigits: 12 },
  { code: "81", flagCode: "jp", name: "Japão", format: false, maxDigits: 12 },
  { code: "60", flagCode: "my", name: "Malásia", format: false, maxDigits: 12 },
  { code: "212", flagCode: "ma", name: "Marrocos", format: false, maxDigits: 12 },
  { code: "52", flagCode: "mx", name: "México", format: false, maxDigits: 12 },
  { code: "234", flagCode: "ng", name: "Nigéria", format: false, maxDigits: 13 },
  { code: "47", flagCode: "no", name: "Noruega", format: false, maxDigits: 10 },
  { code: "64", flagCode: "nz", name: "Nova Zelândia", format: false, maxDigits: 11 },
  { code: "507", flagCode: "pa", name: "Panamá", format: false, maxDigits: 11 },
  { code: "595", flagCode: "py", name: "Paraguai", format: false, maxDigits: 12 },
  { code: "51", flagCode: "pe", name: "Peru", format: false, maxDigits: 11 },
  { code: "48", flagCode: "pl", name: "Polônia", format: false, maxDigits: 11 },
  { code: "351", flagCode: "pt", name: "Portugal", format: false, maxDigits: 12 },
  { code: "44", flagCode: "gb", name: "Reino Unido", format: false, maxDigits: 12 },
  { code: "420", flagCode: "cz", name: "Rep. Tcheca", format: false, maxDigits: 12 },
  { code: "809", flagCode: "do", name: "Rep. Dominicana", format: false, maxDigits: 11 },
  { code: "40", flagCode: "ro", name: "Romênia", format: false, maxDigits: 11 },
  { code: "7", flagCode: "ru", name: "Rússia", format: false, maxDigits: 11 },
  { code: "65", flagCode: "sg", name: "Singapura", format: false, maxDigits: 10 },
  { code: "46", flagCode: "se", name: "Suécia", format: false, maxDigits: 12 },
  { code: "41", flagCode: "ch", name: "Suíça", format: false, maxDigits: 11 },
  { code: "66", flagCode: "th", name: "Tailândia", format: false, maxDigits: 11 },
  { code: "90", flagCode: "tr", name: "Turquia", format: false, maxDigits: 12 },
  { code: "380", flagCode: "ua", name: "Ucrânia", format: false, maxDigits: 12 },
  { code: "598", flagCode: "uy", name: "Uruguai", format: false, maxDigits: 12 },
  { code: "58", flagCode: "ve", name: "Venezuela", format: false, maxDigits: 12 },
  { code: "84", flagCode: "vn", name: "Vietnã", format: false, maxDigits: 12 },
] as const;

type Country = (typeof COUNTRIES)[number];

interface WhatsAppInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  showFormatted?: boolean;
  defaultCountryCode?: string;
}

function findCountryByCode(rawValue: string): Country {
  // Try longest code first (3 digits, then 2, then 1)
  for (const len of [3, 2, 1]) {
    const prefix = rawValue.slice(0, len);
    const found = COUNTRIES.find(c => c.code === prefix);
    if (found) return found;
  }
  return COUNTRIES[0]; // default Brazil
}

/**
 * Formats a Brazilian number for display: (XX) XXXXX-XXXX
 */
function formatBrazilLocal(localNumber: string): string {
  if (localNumber.length <= 2) return localNumber;
  if (localNumber.length <= 7) return `(${localNumber.slice(0, 2)}) ${localNumber.slice(2)}`;
  return `(${localNumber.slice(0, 2)}) ${localNumber.slice(2, 7)}-${localNumber.slice(7, 11)}`;
}

/**
 * Formats a WhatsApp number for display: +55 (XX) XXXXX-XXXX
 */
export function formatWhatsAppDisplay(value: string): string {
  const numbers = value.replace(/\D/g, "");
  if (!numbers) return "";

  const country = findCountryByCode(numbers);
  const localNumber = numbers.slice(country.code.length);

  if (country.code === "55" && localNumber.length > 0) {
    return `+55 ${formatBrazilLocal(localNumber)}`;
  }

  return `+${country.code} ${localNumber}`;
}

/**
 * Extracts raw numbers from a WhatsApp input, ensuring it starts with country code
 */
export function parseWhatsAppRaw(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Validates a Brazilian WhatsApp number
 */
export function isValidBrazilianWhatsApp(value: string): boolean {
  const numbers = value.replace(/\D/g, "");
  return numbers.length === 13 && numbers.startsWith("55");
}

/**
 * Validates any WhatsApp number (min 10 digits total)
 */
export function isValidWhatsApp(value: string): boolean {
  const numbers = value.replace(/\D/g, "");
  return numbers.length >= 10;
}

const WhatsAppInput = forwardRef<HTMLInputElement, WhatsAppInputProps>(
  ({ value, onChange, className, showFormatted = true, defaultCountryCode, ...props }, ref) => {
    const defaultCountry = defaultCountryCode
      ? COUNTRIES.find(c => c.code === defaultCountryCode) ?? COUNTRIES[0]
      : COUNTRIES[0];
    const [selectedCountry, setSelectedCountry] = useState<Country>(defaultCountry);
    const [localNumber, setLocalNumber] = useState("");
    const [popoverOpen, setPopoverOpen] = useState(false);
    const initialized = useRef(false);

    // Update default country when prop changes (e.g. language switch)
    useEffect(() => {
      if (defaultCountryCode && !initialized.current) {
        const country = COUNTRIES.find(c => c.code === defaultCountryCode);
        if (country) setSelectedCountry(country);
      }
    }, [defaultCountryCode]);

    // Initialize from value on first render
    useEffect(() => {
      if (!initialized.current && value) {
        const numbers = value.replace(/\D/g, "");
        if (numbers) {
          const country = findCountryByCode(numbers);
          setSelectedCountry(country);
          setLocalNumber(numbers.slice(country.code.length));
          initialized.current = true;
        }
      } else if (!value) {
        initialized.current = false;
      }
    }, [value]);

    const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let digits = e.target.value.replace(/\D/g, "");
      const code = selectedCountry.code;
      const maxLocal = selectedCountry.maxDigits - code.length;

      // Autocomplete do navegador pode inserir o numero completo com codigo do pais.
      // Se os digitos comecam com o codigo do pais E excedem o tamanho local maximo,
      // removemos o prefixo duplicado.
      if (digits.startsWith(code) && digits.length > maxLocal) {
        digits = digits.slice(code.length);
      }

      const trimmed = digits.slice(0, maxLocal);
      setLocalNumber(trimmed);
      onChange(code + trimmed);
    };

    const handleCountrySelect = (country: Country) => {
      setSelectedCountry(country);
      // Reset local number when changing country since format differs
      const maxLocal = country.maxDigits - country.code.length;
      const trimmed = localNumber.slice(0, maxLocal);
      setLocalNumber(trimmed);
      onChange(country.code + trimmed);
      setPopoverOpen(false);
    };

    const displayValue = showFormatted && selectedCountry.code === "55"
      ? formatBrazilLocal(localNumber)
      : localNumber;

    const rawFull = selectedCountry.code + localNumber;

    return (
      <div className="space-y-1">
        <div className="flex gap-0">
          {/* Country selector */}
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1 px-2.5 h-10 rounded-l-md border border-r-0 border-input bg-muted/50 text-sm shrink-0 hover:bg-muted transition-colors",
                  className?.includes("bg-[#141417]") && "bg-[#1a1a1e] border-[#2a2a2e] hover:bg-[#222226]"
                )}
              >
                <img src={`https://flagcdn.com/w20/${selectedCountry.flagCode}.png`} alt={selectedCountry.name} className="w-5 h-auto rounded-sm" />
                <span className="text-xs text-muted-foreground">+{selectedCountry.code}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-56 p-1 bg-popover border-border"
              align="start"
              sideOffset={4}
            >
              <div className="max-h-60 overflow-y-auto">
                {COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={cn(
                      "flex items-center gap-2 w-full px-2.5 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                      selectedCountry.code === country.code && "bg-accent text-accent-foreground"
                    )}
                  >
                    <img src={`https://flagcdn.com/w20/${country.flagCode}.png`} alt={country.name} className="w-5 h-auto rounded-sm" />
                    <span className="flex-1 text-left">{country.name}</span>
                    <span className="text-xs text-muted-foreground">+{country.code}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Phone number input */}
          <Input
            ref={ref}
            type="tel"
            inputMode="numeric"
            value={displayValue}
            onChange={handleLocalChange}
            onBlur={(e) => {
              // Fallback: alguns teclados Android (Gboard com sugestões) inserem texto
              // sem disparar input/change. Forçamos sincronia ao sair do campo.
              const domDigits = e.target.value.replace(/\D/g, "");
              if (domDigits && domDigits !== localNumber) {
                handleLocalChange({ target: { value: e.target.value } } as React.ChangeEvent<HTMLInputElement>);
              }
              props.onBlur?.(e);
            }}
            placeholder={selectedCountry.code === "55" ? "(00) 00000-0000" : "Número"}
            className={cn("rounded-l-none", className)}
            {...props}
          />
        </div>
        {rawFull.length > selectedCountry.code.length && !isValidWhatsApp(rawFull) && (
          <p className="text-xs text-destructive/80">
            Número incompleto (mínimo 10 dígitos)
          </p>
        )}
      </div>
    );
  }
);

WhatsAppInput.displayName = "WhatsAppInput";

export { WhatsAppInput };
