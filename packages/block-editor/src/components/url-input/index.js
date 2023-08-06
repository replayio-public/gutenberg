/**
 * External dependencies
 */

import classnames from 'classnames';
import scrollIntoView from 'dom-scroll-into-view';

/**
 * WordPress dependencies
 */
import { __, sprintf, _n } from '@wordpress/i18n';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { UP, DOWN, ENTER, TAB } from '@wordpress/keycodes';
import {
    BaseControl,
    Button,
    Spinner,
    withSpokenMessages,
    Popover,
} from '@wordpress/components';
import {
    compose, withInstanceId,
    withSafeTimeout
} from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * Whether the argument is a function.
 *
 * @param {*} maybeFunc The argument to check.
 * @return {boolean} True if the argument is a function, false otherwise.
 */
function isFunction( maybeFunc ) {
	return typeof maybeFunc === 'function';
}

const URLInput = (props) => {


    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);
    const [suggestionsListboxId, setSuggestionsListboxId] = useState('');
    const [suggestionOptionIdPrefix, setSuggestionOptionIdPrefix] = useState('');
    const [showSuggestions, setShowSuggestions] = useState();
    const [selectedSuggestion, setSelectedSuggestion] = useState();

    useEffect(() => {
		
		const { value, __experimentalShowInitialSuggestions = false } =
			props;

		// Only have to worry about scrolling selected suggestion into view
		// when already expanded.
		if (
			showSuggestions &&
			selectedSuggestion !== null &&
			suggestionNodesHandler[ selectedSuggestion ] &&
			! scrollingIntoViewHandler
		) {
			scrollingIntoViewHandler = true;
			scrollIntoView(
				suggestionNodesHandler[ selectedSuggestion ],
				autocompleteRefHandler.current,
				{
					onlyScrollIfNeeded: true,
				}
			);

			props.setTimeout( () => {
				scrollingIntoViewHandler = false;
			}, 100 );
		}

		// Update suggestions when the value changes.
		if (
			prevProps.value !== value &&
			! props.disableSuggestions &&
			! isUpdatingSuggestionsHandler
		) {
			if ( value?.length ) {
				// If the new value is not empty we need to update with suggestions for it.
				updateSuggestionsHandler( value );
			} else if ( __experimentalShowInitialSuggestions ) {
				// If the new value is empty and we can show initial suggestions, then show initial suggestions.
				updateSuggestionsHandler();
			}
		}
	}, [showSuggestions, selectedSuggestion]);
    useEffect(() => {
		if ( shouldShowInitialSuggestionsHandler() ) {
			updateSuggestionsHandler();
		}
	}, []);
    useEffect(() => {
    return () => {
		suggestionsRequestHandler?.cancel?.();
		delete suggestionsRequestHandler;
	};
}, []);
    const bindSuggestionNodeHandler = useCallback(( index ) => {
		return ( ref ) => {
			suggestionNodesHandler[ index ] = ref;
		};
	}, []);
    const shouldShowInitialSuggestionsHandler = useCallback(() => {
		
		const { __experimentalShowInitialSuggestions = false, value } =
			props;
		return (
			! isUpdatingSuggestionsHandler &&
			__experimentalShowInitialSuggestions &&
			! ( value && value.length ) &&
			! ( suggestions && suggestions.length )
		);
	}, [suggestions]);
    const updateSuggestionsHandler = useCallback(( value = '' ) => {
		const {
			__experimentalFetchLinkSuggestions: fetchLinkSuggestions,
			__experimentalHandleURLSuggestions: handleURLSuggestions,
		} = props;

		if ( ! fetchLinkSuggestions ) {
			return;
		}

		// Initial suggestions may only show if there is no value
		// (note: this includes whitespace).
		const isInitialSuggestions = ! value?.length;

		// Trim only now we've determined whether or not it originally had a "length"
		// (even if that value was all whitespace).
		value = value.trim();

		// Allow a suggestions request if:
		// - there are at least 2 characters in the search input (except manual searches where
		//   search input length is not required to trigger a fetch)
		// - this is a direct entry (eg: a URL)
		if (
			! isInitialSuggestions &&
			( value.length < 2 || ( ! handleURLSuggestions && isURL( value ) ) )
		) {
			setShowSuggestions(false);
    setSelectedSuggestion(null);
    setLoading(false);

			return;
		}

		isUpdatingSuggestionsHandler = true;

		setSelectedSuggestion(null);
    setLoading(true);

		const request = fetchLinkSuggestions( value, {
			isInitialSuggestions,
		} );

		request
			.then( ( suggestions ) => {
				// A fetch Promise doesn't have an abort option. It's mimicked by
				// comparing the request reference in on the instance, which is
				// reset or deleted on subsequent requests or unmounting.
				if ( suggestionsRequestHandler !== request ) {
					return;
				}

				setSuggestions(suggestions);
    setLoading(false);
    setShowSuggestions(!! suggestions.length);

				if ( !! suggestions.length ) {
					props.debouncedSpeak(
						sprintf(
							/* translators: %s: number of results. */
							_n(
								'%d result found, use up and down arrow keys to navigate.',
								'%d results found, use up and down arrow keys to navigate.',
								suggestions.length
							),
							suggestions.length
						),
						'assertive'
					);
				} else {
					props.debouncedSpeak(
						__( 'No results.' ),
						'assertive'
					);
				}
				isUpdatingSuggestionsHandler = false;
			} )
			.catch( () => {
				if ( suggestionsRequestHandler === request ) {
					setLoading(false);
					isUpdatingSuggestionsHandler = false;
				}
			} );

		// Note that this assignment is handled *before* the async search request
		// as a Promise always resolves on the next tick of the event loop.
		suggestionsRequestHandler = request;
	}, [suggestions]);
    const onChangeHandler = useCallback(( event ) => {
		const inputValue = event.target.value;

		props.onChange( inputValue );
		if ( ! props.disableSuggestions ) {
			updateSuggestionsHandler( inputValue );
		}
	}, []);
    const onFocusHandler = useCallback(() => {
		
		const { disableSuggestions, value } = props;

		// When opening the link editor, if there's a value present, we want to load the suggestions pane with the results for this input search value
		// Don't re-run the suggestions on focus if there are already suggestions present (prevents searching again when tabbing between the input and buttons)
		if (
			value &&
			! disableSuggestions &&
			! isUpdatingSuggestionsHandler &&
			! ( suggestions && suggestions.length )
		) {
			// Ensure the suggestions are updated with the current input value.
			updateSuggestionsHandler( value );
		}
	}, [suggestions]);
    const onKeyDownHandler = useCallback(( event ) => {
		

		// If the suggestions are not shown or loading, we shouldn't handle the arrow keys
		// We shouldn't preventDefault to allow block arrow keys navigation.
		if ( ! showSuggestions || ! suggestions.length || loading ) {
			// In the Windows version of Firefox the up and down arrows don't move the caret
			// within an input field like they do for Mac Firefox/Chrome/Safari. This causes
			// a form of focus trapping that is disruptive to the user experience. This disruption
			// only happens if the caret is not in the first or last position in the text input.
			// See: https://github.com/WordPress/gutenberg/issues/5693#issuecomment-436684747
			switch ( event.keyCode ) {
				// When UP is pressed, if the caret is at the start of the text, move it to the 0
				// position.
				case UP: {
					if ( 0 !== event.target.selectionStart ) {
						event.preventDefault();

						// Set the input caret to position 0.
						event.target.setSelectionRange( 0, 0 );
					}
					break;
				}
				// When DOWN is pressed, if the caret is not at the end of the text, move it to the
				// last position.
				case DOWN: {
					if (
						props.value.length !== event.target.selectionStart
					) {
						event.preventDefault();

						// Set the input caret to the last position.
						event.target.setSelectionRange(
							props.value.length,
							props.value.length
						);
					}
					break;
				}

				// Submitting while loading should trigger onSubmit.
				case ENTER: {
					event.preventDefault();
					if ( props.onSubmit ) {
						props.onSubmit( null, event );
					}

					break;
				}
			}

			return;
		}

		const suggestion =
			suggestions[ selectedSuggestion ];

		switch ( event.keyCode ) {
			case UP: {
				event.preventDefault();
				const previousIndex = ! selectedSuggestion
					? suggestions.length - 1
					: selectedSuggestion - 1;
				setSelectedSuggestion(previousIndex);
				break;
			}
			case DOWN: {
				event.preventDefault();
				const nextIndex =
					selectedSuggestion === null ||
					selectedSuggestion === suggestions.length - 1
						? 0
						: selectedSuggestion + 1;
				setSelectedSuggestion(nextIndex);
				break;
			}
			case TAB: {
				if ( selectedSuggestion !== null ) {
					selectLinkHandler( suggestion );
					// Announce a link has been selected when tabbing away from the input field.
					props.speak( __( 'Link selected.' ) );
				}
				break;
			}
			case ENTER: {
				event.preventDefault();
				if ( selectedSuggestion !== null ) {
					selectLinkHandler( suggestion );

					if ( props.onSubmit ) {
						props.onSubmit( suggestion, event );
					}
				} else if ( props.onSubmit ) {
					props.onSubmit( null, event );
				}

				break;
			}
		}
	}, [showSuggestions, suggestions, selectedSuggestion]);
    const selectLinkHandler = useCallback(( suggestion ) => {
		props.onChange( suggestion.url, suggestion );
		setSelectedSuggestion(null);
    setShowSuggestions(false);
	}, []);
    const handleOnClickHandler = useCallback(( suggestion ) => {
		selectLinkHandler( suggestion );
		// Move focus to the input field when a link suggestion is clicked.
		inputRefHandler.current.focus();
	}, []);
    const renderControlHandler = useCallback(() => {
		const {
			label = null,
			className,
			isFullWidth,
			instanceId,
			placeholder = __( 'Paste URL or type to search' ),
			__experimentalRenderControl: renderControl,
			value = '',
		} = props;

		

		const inputId = `url-input-control-${ instanceId }`;

		const controlProps = {
			id: inputId, // Passes attribute to label for the for attribute
			label,
			className: classnames( 'block-editor-url-input', className, {
				'is-full-width': isFullWidth,
			} ),
		};

		const inputProps = {
			id: inputId,
			value,
			required: true,
			className: 'block-editor-url-input__input',
			type: 'text',
			onChange: onChangeHandler,
			onFocus: onFocusHandler,
			placeholder,
			onKeyDown: onKeyDownHandler,
			role: 'combobox',
			'aria-label': label ? undefined : __( 'URL' ), // Ensure input always has an accessible label
			'aria-expanded': showSuggestions,
			'aria-autocomplete': 'list',
			'aria-controls': suggestionsListboxId,
			'aria-activedescendant':
				selectedSuggestion !== null
					? `${ suggestionOptionIdPrefix }-${ selectedSuggestion }`
					: undefined,
			ref: inputRefHandler,
		};

		if ( renderControl ) {
			return renderControl( controlProps, inputProps, loading );
		}

		return (
			<BaseControl { ...controlProps }>
				<input { ...inputProps } />
				{ loading && <Spinner /> }
			</BaseControl>
		);
	}, [showSuggestions, suggestionsListboxId, selectedSuggestion, suggestionOptionIdPrefix]);
    const renderSuggestionsHandler = useCallback(() => {
		const {
			className,
			__experimentalRenderSuggestions: renderSuggestions,
			value = '',
			__experimentalShowInitialSuggestions = false,
		} = props;

		

		const suggestionsListProps = {
			id: suggestionsListboxId,
			ref: autocompleteRefHandler,
			role: 'listbox',
		};

		const buildSuggestionItemProps = ( suggestion, index ) => {
			return {
				role: 'option',
				tabIndex: '-1',
				id: `${ suggestionOptionIdPrefix }-${ index }`,
				ref: bindSuggestionNodeHandler( index ),
				'aria-selected': index === selectedSuggestion,
			};
		};

		if (
			isFunction( renderSuggestions ) &&
			showSuggestions &&
			!! suggestions.length
		) {
			return renderSuggestions( {
				suggestions,
				selectedSuggestion,
				suggestionsListProps,
				buildSuggestionItemProps,
				isLoading: loading,
				handleSuggestionClick: handleOnClickHandler,
				isInitialSuggestions:
					__experimentalShowInitialSuggestions &&
					! ( value && value.length ),
			} );
		}

		if (
			! isFunction( renderSuggestions ) &&
			showSuggestions &&
			!! suggestions.length
		) {
			return (
				<Popover position="bottom" focusOnMount={ false }>
					<div
						{ ...suggestionsListProps }
						className={ classnames(
							'block-editor-url-input__suggestions',
							`${ className }__suggestions`
						) }
					>
						{ suggestions.map( ( suggestion, index ) => (
							<Button
								{ ...buildSuggestionItemProps(
									suggestion,
									index
								) }
								key={ suggestion.id }
								className={ classnames(
									'block-editor-url-input__suggestion',
									{
										'is-selected':
											index === selectedSuggestion,
									}
								) }
								onClick={ () =>
									handleOnClickHandler( suggestion )
								}
							>
								{ suggestion.title }
							</Button>
						) ) }
					</div>
				</Popover>
			);
		}
		return null;
	}, [suggestionsListboxId, suggestionOptionIdPrefix, selectedSuggestion, showSuggestions, suggestions]);

    return (
			<>
				{ renderControlHandler() }
				{ renderSuggestionsHandler() }
			</>
		); 
};

URLInput.getDerivedStateFromProps = (
		{
			value,
			instanceId,
			disableSuggestions,
			__experimentalShowInitialSuggestions = false,
		},
		{ showSuggestions }
	) => {
		let shouldShowSuggestions = showSuggestions;

		const hasValue = value && value.length;

		if ( ! __experimentalShowInitialSuggestions && ! hasValue ) {
			shouldShowSuggestions = false;
		}

		if ( disableSuggestions === true ) {
			shouldShowSuggestions = false;
		}

		return {
			showSuggestions: shouldShowSuggestions,
			suggestionsListboxId: `block-editor-url-input-suggestions-${ instanceId }`,
			suggestionOptionIdPrefix: `block-editor-url-input-suggestion-${ instanceId }`,
		};
	};


/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/url-input/README.md
 */
export default compose(
	withSafeTimeout,
	withSpokenMessages,
	withInstanceId,
	withSelect( ( select, props ) => {
		// If a link suggestions handler is already provided then
		// bail.
		if ( isFunction( props.__experimentalFetchLinkSuggestions ) ) {
			return;
		}
		const { getSettings } = select( blockEditorStore );
		return {
			__experimentalFetchLinkSuggestions:
				getSettings().__experimentalFetchLinkSuggestions,
		};
	} )
)( URLInput );
