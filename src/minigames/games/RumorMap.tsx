import type { RumorMapGame } from '../../content/types';
import type { WarTable } from '../../game/types';
import { WarChoiceBoard } from '../WarChoiceBoard';

export function RumorMap({
  data,
  warTable,
  onWarChange,
  onReady,
  onCaption,
}: {
  data: RumorMapGame;
  warTable: WarTable;
  onWarChange: (table: WarTable) => void;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  return (
    <WarChoiceBoard
      data={data}
      warTable={warTable}
      onWarChange={onWarChange}
      onReady={onReady}
      onCaption={onCaption}
      variant="rumor"
    />
  );
}
