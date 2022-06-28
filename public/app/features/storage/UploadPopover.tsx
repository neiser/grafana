import { css } from '@emotion/css';
import { useDialog } from '@react-aria/dialog';
import { FocusScope } from '@react-aria/focus';
import { useOverlay } from '@react-aria/overlays';
import React, { createRef, useState } from 'react';
import SVG from 'react-inlinesvg';

import { GrafanaTheme2 } from '@grafana/data';
import { Button, ButtonGroup, Field, FileDropzone, useStyles2 } from '@grafana/ui';

interface Props {
  onUpload: () => void;
  onClose: () => void;
}

interface ErrorResponse {
  message: string;
}

const FileDropzoneCustomChildren = ({ secondaryText = 'Drag and drop here or browse' }) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.iconWrapper}>
      <small className={styles.small}>{secondaryText}</small>
    </div>
  );
};

export const UploadPopover = (props: Props) => {
  const { onUpload, onClose } = props;
  const [file, setFile] = useState<File | undefined>(undefined);

  const styles = useStyles2(getStyles);

  const ref = createRef<HTMLElement>();
  const { dialogProps } = useDialog({}, ref);
  const { overlayProps } = useOverlay({ onClose, isDismissable: true, isOpen: true }, ref);

  const [error, setError] = useState<ErrorResponse>({ message: '' });

  const Preview = () => {
    if (!file) {
      return <></>;
    }
    const isImage = file.type?.startsWith('image/');
    const isSvg = file.name?.endsWith('.svg');

    const src = URL.createObjectURL(file);
    return (
      <Field label="Preview">
        <div className={styles.iconPreview}>
          {isSvg && <SVG src={src} className={styles.img} />}
          {isImage && !isSvg && <img src={src} className={styles.img} />}
        </div>
      </Field>
    );
  };

  return (
    <FocusScope contain autoFocus restoreFocus>
      <section ref={ref} {...overlayProps} {...dialogProps}>
        <div className={styles.resourcePickerPopover}>
          <div className={styles.resourcePickerPopoverContent}>
            <FileDropzone
              readAs="readAsBinaryString"
              onFileRemove={() => {
                setFile(undefined);
              }}
              options={{
                accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
                multiple: false,
                onDrop: (acceptedFiles: File[]) => {
                  setFile(acceptedFiles[0]);
                },
              }}
            >
              {error.message !== '' ? (
                <p>{error.message}</p>
              ) : Boolean(file) ? (
                <Preview />
              ) : (
                <FileDropzoneCustomChildren />
              )}
            </FileDropzone>

            <ButtonGroup className={styles.buttonGroup}>
              <Button className={styles.button} variant={'secondary'} onClick={() => onClose()}>
                Cancel
              </Button>
              <Button
                className={styles.button}
                variant={'primary'}
                disabled={!file}
                onClick={async () => {
                  if (!file) {
                    setError({ message: 'please select a file' });
                    return;
                  }

                  const formData = new FormData();
                  formData.append('file', file);
                  const res = await fetch('/api/storage/upload', {
                    method: 'POST',
                    body: formData,
                  });

                  const body = await res.json();

                  if (res.status === 200) {
                    onUpload();
                    return;
                  }

                  setError(body);
                }}
              >
                Upload
              </Button>
            </ButtonGroup>
          </div>
        </div>
      </section>
    </FocusScope>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  resourcePickerPopover: css`
    border-radius: ${theme.shape.borderRadius()};
    box-shadow: ${theme.shadows.z3};
    background: ${theme.colors.background.primary};
    border: 1px solid ${theme.colors.border.medium};
  `,
  resourcePickerPopoverContent: css`
    width: 315px;
    font-size: ${theme.typography.bodySmall.fontSize};
    min-height: 184px;
    padding: ${theme.spacing(1)};
    display: flex;
    flex-direction: column;
  `,
  buttonGroup: css`
    align-self: center;
    flex-direction: row;
  `,
  button: css`
    margin: 12px 20px 5px;
  `,
  iconPreview: css`
    width: 238px;
    height: 198px;
    border: 1px solid ${theme.colors.border.medium};
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  img: css`
    width: 147px;
    height: 147px;
    fill: ${theme.colors.text.primary};
  `,
  iconWrapper: css`
    display: flex;
    flex-direction: column;
    align-items: center;
  `,
  small: css`
    color: ${theme.colors.text.secondary};
    margin-bottom: ${theme.spacing(2)};
  `,
});