/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';
import { useState, useCallback } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { link, keyboardReturn, arrowLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import URLInput from './';

const URLInputButton = (props) => {


    const [expanded, setExpanded] = useState(false);

    const toggleHandler = useCallback(() => {
		setExpanded(! expanded);
	}, [expanded]);
    const submitLinkHandler = useCallback(( event ) => {
		event.preventDefault();
		toggleHandler();
	}, []);

    const { url, onChange } = props;
		
		const buttonLabel = url ? __( 'Edit link' ) : __( 'Insert link' );

		return (
			<div className="block-editor-url-input__button">
				<Button
					icon={ link }
					label={ buttonLabel }
					onClick={ toggleHandler }
					className="components-toolbar__control"
					isPressed={ !! url }
				/>
				{ expanded && (
					<form
						className="block-editor-url-input__button-modal"
						onSubmit={ submitLinkHandler }
					>
						<div className="block-editor-url-input__button-modal-line">
							<Button
								className="block-editor-url-input__back"
								icon={ arrowLeft }
								label={ __( 'Close' ) }
								onClick={ toggleHandler }
							/>
							<URLInput
								value={ url || '' }
								onChange={ onChange }
							/>
							<Button
								icon={ keyboardReturn }
								label={ __( 'Submit' ) }
								type="submit"
							/>
						</div>
					</form>
				) }
			</div>
		); 
};




/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/url-input/README.md
 */
export default URLInputButton;
