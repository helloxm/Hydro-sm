import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { i18n } from 'vj/utils';
import { RootState } from './reducers';

export default function SmNotebook() {
  const config = useSelector((state: RootState) => state.ui.settings.config);
  const parsed = React.useMemo(() => {
    const settings = { fontSize: 14, tabSize: 4 };
    try {
      Object.assign(settings, config);
    } catch (e) { }
    return settings;
  }, [config]);
  const dispatch = useDispatch();
  function dispatcher(setting: string, numeric = false) {
    return (ev) => {
      const val = ev?.target?.value || ev;
      dispatch({ type: 'SCRATCHPAD_SETTING_UPDATE', payload: { setting, value: numeric ? +val : val } });
    };
  }
  function openThemeSelect() {
    dispatch({ type: 'SCRATCHPAD_TRIGGER_EDITOR_COMMAND', payload: { command: 'hydro.changeEditorTheme' } });
  }
  // TODO update style
  return <div>
    <div className="row"><div className="medium-6 columns">
      <label>
        SmNotebook todo...
      </label>
    </div></div>
  </div>;
}
