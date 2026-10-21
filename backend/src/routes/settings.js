const express = require('express');
const { auth } = require('../middleware/auth');
const Setting = require('../models/Setting');
const Event = require('../models/Event');
const User = require('../models/User');
const { readFeatures } = require('../services/featureSettings');

const router = express.Router();

const APP_LOGO_KEY = 'app_logo';
const APP_NAME_KEY = 'app.display_name';
const APP_LAUNCHER_ICON_KEY = 'app_launcher_icon';
const APP_INTRO_VIDEO_KEY = 'app_intro_video';
const APP_INTRO_VIDEO_NAME_KEY = 'app_intro_video_file_name';

const brandingPayload = (key, value, description, order = 0) => ({
  key,
  value: value || '',
  type: 'string',
  category: 'appearance',
  description,
  isPublic: true,
  isEditable: true,
  isRequired: false,
  eventId: null,
  group: 'branding',
  order,
  isActive: true
});

const upsertSetting = async (key, value, description, order = 0) => {
  const payload = brandingPayload(key, value, description, order);
  const existing = await Setting.findOne({ where: { key } });
  if (existing) {
    await existing.update({ value: payload.value, isPublic: true, isActive: true });
    return existing;
  }
  return Setting.create(payload);
};

const upsertAppLogo = async (value) => {
  return upsertSetting(APP_LOGO_KEY, value, 'Uygulama logosu (telefonla giriş ekranı)', 0);
};

const upsertAppLauncherIcon = async (value) => {
  return upsertSetting(
    APP_LAUNCHER_ICON_KEY,
    value,
    'Telefon ana ekranı uygulama ikonu (yeni APK derlemesinde uygulanır)',
    3
  );
};

const readAppIntroVideo = async () => {
  const [urlSetting, nameSetting] = await Promise.all([
    Setting.findOne({ where: { key: APP_INTRO_VIDEO_KEY } }),
    Setting.findOne({ where: { key: APP_INTRO_VIDEO_NAME_KEY } })
  ]);
  return {
    introVideoUrl: urlSetting?.value || '',
    introVideoFileName: nameSetting?.value || ''
  };
};

// @route   GET /api/settings/public/app-logo
// @desc    Public app logo for mobile login
// @access  Public
router.get('/public/app-name', async (req, res) => {
  try {
    const setting = await Setting.findOne({ where: { key: APP_NAME_KEY } });
    res.json({
      success: true,
      appName: (setting?.value || '').trim() || 'Event Week'
    });
  } catch (error) {
    console.error('Get public app name error:', error);
    res.json({ success: true, appName: 'Event Week' });
  }
});

router.get('/app-name', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin or organizer role required.' });
    }
    const setting = await Setting.findOne({ where: { key: APP_NAME_KEY } });
    res.json({
      success: true,
      appName: (setting?.value || '').trim() || 'Event Week'
    });
  } catch (error) {
    console.error('Get app name error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.put('/app-name', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin or organizer role required.' });
    }
    const appName = String(req.body.appName || '').trim().slice(0, 30);
    if (!appName) {
      return res.status(400).json({ success: false, error: 'Uygulama başlığı boş olamaz' });
    }
    const setting = await upsertSetting(APP_NAME_KEY, appName, 'Telefon ana ekranındaki uygulama başlığı', 4);
    res.json({
      success: true,
      appName: setting.value,
      message: 'Uygulama başlığı kaydedildi. Ana ekran adı yeni APK ile değişir.'
    });
  } catch (error) {
    console.error('Update app name error:', error);
    res.status(500).json({ success: false, error: 'Uygulama başlığı güncellenirken bir hata oluştu' });
  }
});

router.get('/public/app-logo', async (req, res) => {
  try {
    const setting = await Setting.findOne({ where: { key: APP_LOGO_KEY } });
    res.json({
      success: true,
      appLogo: setting?.value || null
    });
  } catch (error) {
    console.error('Get public app logo error:', error);
    res.json({
      success: true,
      appLogo: null
    });
  }
});

// @route   GET /api/settings/app-logo
// @desc    Get application logo
// @access  Private (Admin/Organizer)
router.get('/app-logo', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }
    const setting = await Setting.findOne({ where: { key: APP_LOGO_KEY } });
    res.json({
      success: true,
      appLogo: setting?.value || ''
    });
  } catch (error) {
    console.error('Get app logo error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

router.get('/public/app-icon', async (req, res) => {
  try {
    const setting = await Setting.findOne({ where: { key: APP_LAUNCHER_ICON_KEY } });
    res.json({
      success: true,
      appIcon: setting?.value || null
    });
  } catch (error) {
    console.error('Get public app icon error:', error);
    res.json({
      success: true,
      appIcon: null
    });
  }
});

router.get('/app-icon', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }
    const setting = await Setting.findOne({ where: { key: APP_LAUNCHER_ICON_KEY } });
    res.json({
      success: true,
      appIcon: setting?.value || ''
    });
  } catch (error) {
    console.error('Get app icon error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

router.put('/app-icon', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }
    const setting = await upsertAppLauncherIcon(req.body.appIcon);
    res.json({
      success: true,
      appIcon: setting.value || '',
      message: 'Ana ekran ikonu kaydedildi. Yeni APK derlemesinde uygulanır.'
    });
  } catch (error) {
    console.error('Update app icon error:', error);
    res.status(500).json({
      success: false,
      error: 'Ana ekran ikonu güncellenirken bir hata oluştu'
    });
  }
});

router.put('/app-logo', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }
    const setting = await upsertAppLogo(req.body.appLogo);
    res.json({
      success: true,
      appLogo: setting.value || '',
      message: 'Uygulama logosu güncellendi'
    });
  } catch (error) {
    console.error('Update app logo error:', error);
    res.status(500).json({
      success: false,
      error: 'Uygulama logosu güncellenirken bir hata oluştu'
    });
  }
});

router.get('/public/app-intro-video', async (req, res) => {
  try {
    const data = await readAppIntroVideo();
    res.json({
      success: true,
      introVideoUrl: data.introVideoUrl || null,
      introVideoFileName: data.introVideoFileName || null
    });
  } catch (error) {
    console.error('Get public app intro video error:', error);
    res.json({
      success: true,
      introVideoUrl: null,
      introVideoFileName: null
    });
  }
});

router.get('/app-intro-video', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }
    const data = await readAppIntroVideo();
    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error('Get app intro video error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

router.put('/app-intro-video', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }
    const introVideoUrl = req.body.introVideoUrl || '';
    const introVideoFileName = req.body.introVideoFileName || '';
    await upsertSetting(APP_INTRO_VIDEO_KEY, introVideoUrl, 'Uygulama giriş videosu', 1);
    await upsertSetting(APP_INTRO_VIDEO_NAME_KEY, introVideoFileName, 'Uygulama giriş videosu dosya adı', 2);
    res.json({
      success: true,
      introVideoUrl,
      introVideoFileName,
      message: 'Giriş videosu güncellendi'
    });
  } catch (error) {
    console.error('Update app intro video error:', error);
    res.status(500).json({
      success: false,
      error: 'Giriş videosu güncellenirken bir hata oluştu'
    });
  }
});

router.get('/public/features', async (req, res) => {
  try {
    const features = await readFeatures();
    res.json({ success: true, ...features });
  } catch (error) {
    console.error('Get public features error:', error);
    res.json({
      success: true,
      postsEnabled: true,
      storiesEnabled: true,
      commentsEnabled: true
    });
  }
});

// @route   GET /api/settings
// @desc    Get all settings
// @access  Private (Admin/Organizer)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const { eventId, category, group, isPublic, isActive } = req.query;
    
    let whereClause = {};
    
    if (eventId) whereClause.eventId = eventId;
    if (category) whereClause.category = category;
    if (group) whereClause.group = group;
    if (isPublic !== undefined) whereClause.isPublic = isPublic === 'true';
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    
    const settings = await Setting.findAll({
      where: whereClause,
      order: [['key', 'ASC']]
    });

    res.json({
      success: true,
      settings: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/settings/:key
// @desc    Get setting by key
// @access  Private (Admin/Organizer)
router.get('/:key', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const setting = await Setting.findOne({
      where: { key: req.params.key },
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    if (!setting) {
      return res.status(404).json({
        success: false,
        error: 'Setting not found'
      });
    }

    res.json({
      success: true,
      setting: setting
    });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/settings
// @desc    Create new setting
// @access  Private (Admin/Organizer)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const { 
      key, 
      value, 
      type, 
      category, 
      description, 
      isPublic, 
      isEditable, 
      isRequired, 
      defaultValue, 
      validation, 
      options, 
      group, 
      order, 
      eventId, 
      notes
    } = req.body;

    if (!key || !type || !category) {
      return res.status(400).json({
        success: false,
        error: 'Anahtar, tip ve kategori alanları zorunludur'
      });
    }

    // Check if setting with this key already exists
    const existingSetting = await Setting.findOne({
      where: { key: key }
    });

    if (existingSetting) {
      return res.status(400).json({
        success: false,
        error: 'Bu anahtar ile zaten bir ayar mevcut'
      });
    }

    const settingData = {
      key,
      value: value || '',
      type,
      category,
      description: description || '',
      isPublic: isPublic || false,
      isEditable: isEditable !== undefined ? isEditable : true,
      isRequired: isRequired || false,
      defaultValue: defaultValue || '',
      validation: validation || '',
      options: options || '',
      group: group || '',
      order: order || 0,
      eventId: eventId || null,
      updatedBy: req.user.id,
      notes: notes || ''
    };

    const setting = await Setting.create(settingData);
    
    const createdSetting = await Setting.findByPk(setting.id, {
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    res.status(201).json({
      success: true,
      setting: createdSetting,
      message: 'Ayar başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Create setting error:', error);
    res.status(500).json({
      success: false,
      error: 'Ayar oluşturulurken bir hata oluştu'
    });
  }
});

// @route   PUT /api/settings/:key
// @desc    Update setting
// @access  Private (Admin/Organizer)
router.put('/:key', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const setting = await Setting.findOne({
      where: { key: req.params.key }
    });

    if (!setting) {
      return res.status(404).json({
        success: false,
        error: 'Setting not found'
      });
    }

    // Check if setting is editable
    if (!setting.isEditable) {
      return res.status(400).json({
        success: false,
        error: 'Bu ayar düzenlenemez'
      });
    }

    const updateData = req.body;
    updateData.updatedBy = req.user.id;
    
    await setting.update(updateData);
    
    await setting.reload({
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    res.json({
      success: true,
      setting: setting,
      message: 'Ayar başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({
      success: false,
      error: 'Ayar güncellenirken bir hata oluştu'
    });
  }
});

// @route   DELETE /api/settings/:key
// @desc    Delete setting
// @access  Private (Admin/Organizer)
router.delete('/:key', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const setting = await Setting.findOne({
      where: { key: req.params.key }
    });

    if (!setting) {
      return res.status(404).json({
        success: false,
        error: 'Setting not found'
      });
    }

    // Check if setting is required
    if (setting.isRequired) {
      return res.status(400).json({
        success: false,
        error: 'Bu ayar zorunlu olduğu için silinemez'
      });
    }

    await setting.destroy();

    res.json({
      success: true,
      message: 'Ayar başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
