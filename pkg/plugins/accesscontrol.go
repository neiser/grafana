package plugins

import (
	"github.com/grafana/grafana/pkg/models"
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/setting"
)

const (
	// Plugins actions
	ActionInstall       = "plugins:install"
	ActionSettingsWrite = "plugins.settings:write"

	// App Plugins actions
	ActionAppAccess = "plugins.app:access"
)

var (
	ScopeProvider = ac.NewScopeProvider("plugins")
	// Protects access to the Configuration > Plugins page
	// FIXME: In another iteration we'll add a read settings permission check as well
	ConfigurationAccessEvaluator = ac.EvalPermission(ActionSettingsWrite)

	// Protects access to the Server Admin > Plugins page
	AdminAccessEvaluator = ac.EvalPermission(ActionInstall)
)

func DeclareRBACRoles(acService ac.AccessControl, cfg *setting.Cfg) error {
	AppPluginsReader := ac.RoleRegistration{
		Role: ac.RoleDTO{
			Name:        ac.FixedRolePrefix + "plugins.app:reader",
			DisplayName: "Application Plugins Access",
			Description: "Access application plugins (still enforcing the organization role)",
			Group:       "Plugins",
			Permissions: []ac.Permission{
				{Action: ActionAppAccess, Scope: ScopeProvider.GetResourceAllScope()},
			},
		},
		Grants: []string{string(models.ROLE_VIEWER)},
	}
	PluginsWriter := ac.RoleRegistration{
		Role: ac.RoleDTO{
			Name:        ac.FixedRolePrefix + "plugins:writer",
			DisplayName: "Plugin Writer",
			Description: "Enable and disable plugins and edit plugins' settings",
			Group:       "Plugins",
			Permissions: []ac.Permission{
				{Action: ActionSettingsWrite, Scope: ScopeProvider.GetResourceAllScope()},
			},
		},
		Grants: []string{string(models.ROLE_ADMIN)},
	}
	PluginsMaintainer := ac.RoleRegistration{
		Role: ac.RoleDTO{
			Name:        ac.FixedRolePrefix + "plugins:maintainer",
			DisplayName: "Plugin Maintainer",
			Description: "Install, uninstall plugins",
			Group:       "Plugins",
			Permissions: []ac.Permission{
				{Action: ActionInstall},
			},
		},
		Grants: []string{ac.RoleGrafanaAdmin},
	}

	// Remove possibility to install plugins if `plugin_admin_enable` is false
	if !cfg.PluginAdminEnabled {
		PluginsMaintainer.Grants = []string{}
	}

	return acService.DeclareFixedRoles(AppPluginsReader, PluginsWriter, PluginsMaintainer)
}
