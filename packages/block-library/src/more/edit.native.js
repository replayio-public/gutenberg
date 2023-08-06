/**
 * External dependencies
 */

import { View } from 'react-native';
import Hr from 'react-native-hr';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './editor.scss';

export export const MoreEdit = (props) => {


    const [defaultText, setDefaultText] = useState(__( 'Read more' ));

    

    const { attributes, getStylesFromColorScheme } = props;
		const { customText } = attributes;
		

		const content = customText || defaultText;
		const textStyle = getStylesFromColorScheme(
			styles.moreText,
			styles.moreTextDark
		);
		const lineStyle = getStylesFromColorScheme(
			styles.moreLine,
			styles.moreLineDark
		);

		return (
			<View>
				<Hr
					text={ content }
					marginLeft={ 0 }
					marginRight={ 0 }
					textStyle={ textStyle }
					lineStyle={ lineStyle }
				/>
			</View>
		); 
};




export default withPreferredColorScheme( MoreEdit );
