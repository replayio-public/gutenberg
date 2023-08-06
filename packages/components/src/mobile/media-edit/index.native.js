/**
 * WordPress dependencies
 */

import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Picker } from '@wordpress/components';
import {
    requestMediaEditor,
    mediaSources,
} from '@wordpress/react-native-bridge';

export const MEDIA_TYPE_IMAGE = 'image';

export const MEDIA_EDITOR = 'MEDIA_EDITOR';

const editOption = {
	id: MEDIA_EDITOR,
	value: MEDIA_EDITOR,
	label: __( 'Edit' ),
	requiresModal: true,
	types: [ MEDIA_TYPE_IMAGE ],
};

const replaceOption = {
	id: mediaSources.deviceLibrary,
	value: mediaSources.deviceLibrary,
	label: __( 'Replace' ),
	types: [ MEDIA_TYPE_IMAGE ],
};

export export const MediaEdit = (props) => {


    

    const getMediaOptionsItemsHandler = useCallback(() => {
		const { pickerOptions, openReplaceMediaOptions, source } = props;

		return [
			source?.uri && editOption,
			openReplaceMediaOptions && replaceOption,
			...( pickerOptions ? pickerOptions : [] ),
		].filter( Boolean );
	}, []);
    const getDestructiveButtonIndexHandler = useCallback(() => {
		const options = getMediaOptionsItemsHandler();
		const destructiveButtonIndex = options.findIndex(
			( option ) => option?.destructiveButton
		);

		return destructiveButtonIndex !== -1
			? destructiveButtonIndex + 1
			: undefined;
	}, []);
    const onPickerPresentHandler = useCallback(() => {
		if ( pickerHandler ) {
			pickerHandler.presentPicker();
		}
	}, []);
    const onPickerSelectHandler = useCallback(( value ) => {
		const {
			onSelect,
			pickerOptions,
			multiple = false,
			openReplaceMediaOptions,
		} = props;

		switch ( value ) {
			case MEDIA_EDITOR:
				requestMediaEditor( props.source.uri, ( media ) => {
					if ( ( multiple && media ) || ( media && media.id ) ) {
						onSelect( media );
					}
				} );
				break;
			default:
				const optionSelected =
					pickerOptions &&
					pickerOptions.find( ( option ) => option.id === value );

				if ( optionSelected && optionSelected.onPress ) {
					optionSelected.onPress();
					return;
				}

				if ( openReplaceMediaOptions ) {
					openReplaceMediaOptions();
				}
		}
	}, []);

    const mediaOptions = () => (
			<Picker
				hideCancelButton
				ref={ ( instance ) => ( pickerHandler = instance ) }
				options={ getMediaOptionsItemsHandler() }
				leftAlign={ true }
				onChange={ onPickerSelectHandler }
				// translators: %s: block title e.g: "Paragraph".
				title={ __( 'Media options' ) }
				destructiveButtonIndex={ getDestructiveButtonIndexHandler() }
			/>
		);

		return props.render( {
			open: onPickerPresentHandler,
			mediaOptions,
		} ); 
};




export default MediaEdit;
