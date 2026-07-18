import { ToggleButtonGroup, ToggleButton, Typography, Tooltip } from '@mui/material';
import { useLanguage, type Lang } from '../../i18n/LanguageContext';

export default function LanguageSwitcher({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const { lang, setLang } = useLanguage();

  return (
    <Tooltip title={lang === 'en' ? 'မြန်မာဘာသာ' : 'English'}>
      <ToggleButtonGroup
        value={lang}
        exclusive
        onChange={(_, v: Lang | null) => { if (v) setLang(v); }}
        size="small"
        sx={{
          '& .MuiToggleButton-root': {
            px: variant === 'desktop' ? 1.5 : 1,
            py: 0.3,
            fontWeight: 700,
            fontSize: variant === 'desktop' ? '0.75rem' : '0.7rem',
            textTransform: 'none',
            border: 'none',
            borderRadius: 2,
            color: 'text.secondary',
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
            },
          },
        }}
      >
        <ToggleButton value="en">
          <Typography component="span" fontWeight={700}>EN</Typography>
        </ToggleButton>
        <ToggleButton value="my">
          <Typography component="span" fontWeight={700}>MY</Typography>
        </ToggleButton>
      </ToggleButtonGroup>
    </Tooltip>
  );
}
