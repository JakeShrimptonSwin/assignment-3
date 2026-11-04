//jake S - History list component

//use MUI stuff for table
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper,
} from '@mui/material';

import HistoryRow from './history_row';

function HistoryList({ history, onDelete }) {
  return (
    <TableContainer className="history-container">
      <Table size="small" className="history-table">
        <TableHead>
          <TableRow>
            <TableCell>Checked</TableCell>
            <TableCell>URL</TableCell>
            <TableCell>Verdict</TableCell>
            <TableCell>Confidence</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {history.map((entry) => (
            <HistoryRow key={entry.id} entry={entry} onDelete={onDelete} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default HistoryList;