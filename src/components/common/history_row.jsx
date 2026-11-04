//Jake S - History row component
//Jake Shrimpton - History row component
import { TableRow, TableCell, IconButton, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

//colours for results, with an error colour - same as other sources that use phishing or benign
const PHISHING_COLOR = '#dc2626';
const BENIGN_COLOR = '#1976d2';
const UNKNOWN_COLOR = '#6b7280';



//convert 1 or 0 to phishing and benign
const getVerdict = (result) => {
  // "prediction" is "phishing" | "benign"; fall back to label (1 / 0)
  const raw = result?.prediction ?? result?.label;
  if (raw === null || raw === undefined) return null;

  const value = String(raw).trim().toLowerCase();

  if (value === 'phishing' || value === '1') {
    return { text: 'Phishing', color: PHISHING_COLOR };
  }
  if (value === 'benign' || value === '0') {
    return { text: 'Benign', color: BENIGN_COLOR };
  }
  return { text: String(raw), color: UNKNOWN_COLOR };
};

const formatPercent = (value) =>
  typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : '-';

function HistoryRow({ entry, onDelete }) {
  const { id, checkedAt, result } = entry;
  const verdict = getVerdict(result);

  return (
    <TableRow className="history-row">
      <TableCell className="history-date">
        {new Date(checkedAt).toLocaleString()}
      </TableCell>
      <TableCell className="history-url">{result?.url ?? 'Unknown URL'}</TableCell>
      <TableCell>
        {verdict && (
          <Chip
            label={verdict.text}
            size="small"
            sx={{ backgroundColor: verdict.color, color: '#fff', fontWeight: 600 }}
          />
        )}
      </TableCell>
      <TableCell>{formatPercent(result?.confidence)}</TableCell>
      <TableCell>
        <IconButton
          aria-label="delete"
          className="history-delete"
          onClick={() => onDelete(id)}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}

export default HistoryRow;