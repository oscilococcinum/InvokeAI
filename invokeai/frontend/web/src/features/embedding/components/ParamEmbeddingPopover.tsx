import {
  Flex,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
} from '@chakra-ui/react';
import { SelectItem } from '@mantine/core';
import { RootState } from 'app/store/store';
import { useAppSelector } from 'app/store/storeHooks';
import IAIMantineMultiSelect from 'common/components/IAIMantineMultiSelect';
import IAIMantineSelectItemWithTooltip from 'common/components/IAIMantineSelectItemWithTooltip';
import { MODEL_TYPE_MAP } from 'features/system/components/ModelSelect';
import { forEach } from 'lodash-es';
import { PropsWithChildren, useCallback, useMemo, useRef } from 'react';
import { useGetTextualInversionModelsQuery } from 'services/api/endpoints/models';
import { PARAMETERS_PANEL_WIDTH } from 'theme/util/constants';
import { useFeatureStatus } from '../../system/hooks/useFeatureStatus';

type Props = PropsWithChildren & {
  onSelect: (v: string) => void;
  isOpen: boolean;
  onClose: () => void;
  enabled?: boolean;
};

const ParamEmbeddingPopover = (props: Props) => {
  const { onSelect, isOpen, onClose, children, enabled } = props;
  const { data: embeddingQueryData } = useGetTextualInversionModelsQuery();
  const inputRef = useRef<HTMLInputElement>(null);

  const currentMainModel = useAppSelector(
    (state: RootState) => state.generation.model
  );

  const data = useMemo(() => {
    if (!embeddingQueryData) {
      return [];
    }

    const data: SelectItem[] = [];

    forEach(embeddingQueryData.entities, (embedding, _) => {
      if (!embedding) {
        return;
      }

      const disabled = currentMainModel?.base_model !== embedding.base_model;

      data.push({
        value: embedding.name,
        label: embedding.name,
        group: MODEL_TYPE_MAP[embedding.base_model],
        disabled,
        tooltip: disabled
          ? `Incompatible base model: ${embedding.base_model}`
          : undefined,
      });
    });

    return data.sort((a, b) => (a.disabled && !b.disabled ? 1 : -1));
  }, [embeddingQueryData, currentMainModel?.base_model]);

  const handleChange = useCallback(
    (v: string[]) => {
      if (v.length === 0) {
        return;
      }

      onSelect(v[0]);
    },
    [onSelect]
  );

  return (
    <Popover
      initialFocusRef={inputRef}
      isOpen={isOpen}
      onClose={onClose}
      placement="bottom"
      openDelay={0}
      closeDelay={0}
      closeOnBlur={true}
      returnFocusOnClose={true}
    >
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent
        sx={{
          p: 0,
          top: -1,
          shadow: 'dark-lg',
          borderColor: 'accent.300',
          borderWidth: '2px',
          borderStyle: 'solid',
          _dark: { borderColor: 'accent.400' },
        }}
      >
        <PopoverBody
          sx={{ p: 0, w: `calc(${PARAMETERS_PANEL_WIDTH} - 2rem )` }}
        >
          {data.length === 0 ? (
            <Flex sx={{ justifyContent: 'center', p: 2 }}>
              <Text
                sx={{ fontSize: 'sm', color: 'base.500', _dark: 'base.700' }}
              >
                No Embeddings Loaded
              </Text>
            </Flex>
          ) : (
            <IAIMantineMultiSelect
              inputRef={inputRef}
              placeholder={'Add Embedding'}
              value={[]}
              data={data}
              maxDropdownHeight={400}
              nothingFound="No Matching Embeddings"
              itemComponent={IAIMantineSelectItemWithTooltip}
              disabled={data.length === 0}
              filter={(value, selected, item: SelectItem) =>
                item.label
                  ?.toLowerCase()
                  .includes(value.toLowerCase().trim()) ||
                item.value.toLowerCase().includes(value.toLowerCase().trim())
              }
              onChange={handleChange}
            />
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default ParamEmbeddingPopover;
